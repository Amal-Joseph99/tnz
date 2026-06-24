-- Cannot drop countries(currency_code) UNIQUE — FKs from orders, currency settings, etc.
-- Map ISO2 locations (DE, FR, …) → existing currency rows (EUR) instead.

CREATE TABLE IF NOT EXISTS public.country_location_codes (
  id BIGSERIAL PRIMARY KEY,
  iso_alpha2 CHAR(2) NOT NULL,
  iso_alpha3 CHAR(3) NOT NULL,
  country_name TEXT NOT NULL,
  isd_code VARCHAR(8) NOT NULL,
  currency_code CHAR(3) NOT NULL REFERENCES public.countries (currency_code),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT country_location_codes_iso_alpha2_unique UNIQUE (iso_alpha2)
);

CREATE INDEX IF NOT EXISTS country_location_codes_currency_idx
  ON public.country_location_codes (currency_code)
  WHERE is_active = true;

ALTER TABLE public.country_location_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read country location codes" ON public.country_location_codes;
CREATE POLICY "Public read country location codes"
  ON public.country_location_codes
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

GRANT SELECT ON public.country_location_codes TO anon, authenticated;

INSERT INTO public.country_location_codes (country_name, iso_alpha2, iso_alpha3, isd_code, currency_code)
VALUES
  ('Germany', 'DE', 'DEU', '49', 'EUR'),
  ('France', 'FR', 'FRA', '33', 'EUR'),
  ('Italy', 'IT', 'ITA', '39', 'EUR'),
  ('Spain', 'ES', 'ESP', '34', 'EUR'),
  ('Netherlands', 'NL', 'NLD', '31', 'EUR'),
  ('Belgium', 'BE', 'BEL', '32', 'EUR'),
  ('Austria', 'AT', 'AUT', '43', 'EUR'),
  ('Portugal', 'PT', 'PRT', '351', 'EUR'),
  ('Ireland', 'IE', 'IRL', '353', 'EUR'),
  ('Greece', 'GR', 'GRC', '30', 'EUR'),
  ('Finland', 'FI', 'FIN', '358', 'EUR'),
  ('Luxembourg', 'LU', 'LUX', '352', 'EUR'),
  ('Slovakia', 'SK', 'SVK', '421', 'EUR'),
  ('Slovenia', 'SI', 'SVN', '386', 'EUR'),
  ('Estonia', 'EE', 'EST', '372', 'EUR'),
  ('Latvia', 'LV', 'LVA', '371', 'EUR'),
  ('Lithuania', 'LT', 'LTU', '370', 'EUR'),
  ('Malta', 'MT', 'MLT', '356', 'EUR'),
  ('Cyprus', 'CY', 'CYP', '357', 'EUR')
ON CONFLICT (iso_alpha2) DO UPDATE
SET
  country_name = EXCLUDED.country_name,
  iso_alpha3 = EXCLUDED.iso_alpha3,
  isd_code = EXCLUDED.isd_code,
  currency_code = EXCLUDED.currency_code,
  is_active = true;

CREATE OR REPLACE FUNCTION public.resolve_currency_by_country(p_iso_alpha2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency TEXT;
  v_iso2 CHAR(2) := upper(btrim(p_iso_alpha2));
BEGIN
  SELECT clc.currency_code
  INTO v_currency
  FROM public.country_location_codes clc
  WHERE clc.iso_alpha2 = v_iso2
    AND clc.is_active = true
  LIMIT 1;

  IF v_currency IS NULL THEN
    SELECT sco.currency_code
    INTO v_currency
    FROM public.seller_country_options sco
    WHERE sco.iso_alpha2 = v_iso2
    LIMIT 1;
  END IF;

  IF v_currency IS NULL THEN
    RAISE EXCEPTION 'Country % is not configured', p_iso_alpha2;
  END IF;

  RETURN public.get_currency_package(v_currency);
END;
$$;

DROP VIEW IF EXISTS public.seller_country_options;

CREATE VIEW public.seller_country_options AS
WITH ranked AS (
  SELECT
    id,
    country_name,
    iso_alpha2,
    iso_alpha3,
    isd_code,
    currency_code,
    currency_symbol,
    fx_rate_usd,
    fx_base_code,
    ROW_NUMBER() OVER (
      PARTITION BY iso_alpha2
      ORDER BY
        CASE currency_code
          WHEN 'CLF' THEN 99
          WHEN 'CNH' THEN 99
          WHEN 'SLL' THEN 99
          WHEN 'ZWL' THEN 99
          WHEN 'XDR' THEN 99
          WHEN 'HRK' THEN 99
          WHEN 'FOK' THEN 99
          WHEN 'KID' THEN 99
          WHEN 'TVD' THEN 99
          WHEN 'XCG' THEN 99
          WHEN 'GGP' THEN 99
          WHEN 'JEP' THEN 99
          WHEN 'IMP' THEN 99
          WHEN 'SHP' THEN 99
          WHEN 'FKP' THEN 99
          WHEN 'GIP' THEN 99
          ELSE 1
        END,
        country_name
    ) AS rn
  FROM public.countries
  WHERE is_active = true
),
base_countries AS (
  SELECT
    id,
    country_name,
    iso_alpha2,
    iso_alpha3,
    isd_code,
    currency_code,
    currency_symbol,
    fx_rate_usd,
    fx_base_code
  FROM ranked
  WHERE rn = 1
)
SELECT * FROM base_countries
UNION ALL
SELECT
  clc.id,
  clc.country_name,
  clc.iso_alpha2,
  clc.iso_alpha3,
  clc.isd_code,
  clc.currency_code,
  c.currency_symbol,
  c.fx_rate_usd,
  c.fx_base_code
FROM public.country_location_codes clc
JOIN public.countries c
  ON c.currency_code = clc.currency_code
 AND c.is_active = true
WHERE clc.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM base_countries bc
    WHERE bc.iso_alpha2 = clc.iso_alpha2
  );

GRANT SELECT ON public.seller_country_options TO anon, authenticated;

COMMENT ON TABLE public.country_location_codes IS
  'ISO 3166-1 alpha-2 buyer/seller locations mapped to a configured countries.currency_code row.';
COMMENT ON COLUMN public.countries.iso_alpha2 IS
  'ISO 3166-1 alpha-2 on the currency master row (may be EU for EUR). Use country_location_codes for DE/FR/…';
