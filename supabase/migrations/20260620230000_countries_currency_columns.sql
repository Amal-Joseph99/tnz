-- Country currency display columns (2-digit / 3-digit country codes + currency symbol on countries)

ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS currency_symbol TEXT;

COMMENT ON COLUMN public.countries.iso_alpha2 IS 'ISO 3166-1 alpha-2 country code (2 letters).';
COMMENT ON COLUMN public.countries.iso_alpha3 IS 'ISO 3166-1 alpha-3 country code (3 letters).';
COMMENT ON COLUMN public.countries.currency_code IS 'ISO 4217 alpha-3 currency code (3 letters).';
COMMENT ON COLUMN public.countries.currency_symbol IS 'Display symbol for the country currency.';

UPDATE public.countries c
SET currency_symbol = cds.symbol
FROM public.currency_display_settings cds
WHERE c.currency_code = cds.currency_code
  AND c.currency_symbol IS NULL;

UPDATE public.countries c
SET currency_symbol = c.currency_code
WHERE c.currency_symbol IS NULL;

ALTER TABLE public.countries
ALTER COLUMN currency_symbol SET NOT NULL;

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
)
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
WHERE rn = 1;

GRANT SELECT ON public.seller_country_options TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_currency_package(p_currency_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency TEXT := upper(btrim(p_currency_code));
  v_rate NUMERIC;
  v_symbol TEXT;
  v_decimals INT;
  v_base TEXT;
BEGIN
  SELECT c.fx_rate_usd, c.currency_symbol
  INTO v_rate, v_symbol
  FROM public.countries c
  WHERE c.currency_code = v_currency
    AND c.is_active = true
  LIMIT 1;

  IF v_rate IS NULL OR v_symbol IS NULL THEN
    RAISE EXCEPTION 'Currency % is not configured in countries table', v_currency;
  END IF;

  SELECT cds.decimal_places
  INTO v_decimals
  FROM public.currency_display_settings cds
  WHERE cds.currency_code = v_currency;

  IF v_decimals IS NULL THEN
    RAISE EXCEPTION 'Currency display settings missing for %', v_currency;
  END IF;

  SELECT acc.base_currency_code
  INTO v_base
  FROM public.app_currency_config acc
  WHERE acc.id = 1;

  RETURN jsonb_build_object(
    'currency_code', v_currency,
    'fx_rate_usd', v_rate,
    'symbol', v_symbol,
    'decimal_places', v_decimals,
    'base_currency_code', v_base
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_country_currency_symbol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.currency_symbol IS NULL OR btrim(NEW.currency_symbol) = '' THEN
    SELECT cds.symbol
    INTO NEW.currency_symbol
    FROM public.currency_display_settings cds
    WHERE cds.currency_code = NEW.currency_code;

    IF NEW.currency_symbol IS NULL THEN
      NEW.currency_symbol := NEW.currency_code;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS countries_sync_currency_symbol ON public.countries;
CREATE TRIGGER countries_sync_currency_symbol
BEFORE INSERT OR UPDATE OF currency_code ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.sync_country_currency_symbol();
