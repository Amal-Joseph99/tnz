-- RLS, seller signup view, seller accounts, FX refresh RPC, hourly cron

-- ---------------------------------------------------------------------------
-- Row level security (public read for reference data)
-- ---------------------------------------------------------------------------
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rate_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read countries" ON public.countries;
CREATE POLICY "Public read countries"
ON public.countries
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public read fx metadata" ON public.fx_rate_metadata;
CREATE POLICY "Public read fx metadata"
ON public.fx_rate_metadata
FOR SELECT
TO anon, authenticated
USING (true);

-- ---------------------------------------------------------------------------
-- One selectable country row per ISO alpha-2 for seller registration
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.seller_country_options AS
WITH ranked AS (
  SELECT
    id,
    country_name,
    iso_alpha2,
    iso_alpha3,
    isd_code,
    currency_code,
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
  fx_rate_usd,
  fx_base_code
FROM ranked
WHERE rn = 1;

GRANT SELECT ON public.seller_country_options TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seller accounts (base currency locked after signup)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  country_id BIGINT NOT NULL REFERENCES public.countries (id),
  country_name TEXT NOT NULL,
  iso_alpha2 CHAR(2) NOT NULL,
  iso_alpha3 CHAR(3) NOT NULL,
  isd_code VARCHAR(8) NOT NULL,
  base_currency_code CHAR(3) NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_accounts_base_currency_immutable CHECK (base_currency_code IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS seller_accounts_country_id_idx ON public.seller_accounts (country_id);
CREATE INDEX IF NOT EXISTS seller_accounts_base_currency_code_idx ON public.seller_accounts (base_currency_code);

ALTER TABLE public.seller_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers read own account" ON public.seller_accounts;
CREATE POLICY "Sellers read own account"
ON public.seller_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prevent_seller_base_currency_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.base_currency_code IS DISTINCT FROM NEW.base_currency_code THEN
    RAISE EXCEPTION 'Seller base currency cannot be changed.';
  END IF;

  IF OLD.country_id IS DISTINCT FROM NEW.country_id THEN
    RAISE EXCEPTION 'Seller country cannot be changed after registration.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_accounts_lock_currency ON public.seller_accounts;
CREATE TRIGGER seller_accounts_lock_currency
BEFORE UPDATE ON public.seller_accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_seller_base_currency_change();

CREATE OR REPLACE FUNCTION public.set_seller_accounts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_accounts_set_updated_at ON public.seller_accounts;
CREATE TRIGGER seller_accounts_set_updated_at
BEFORE UPDATE ON public.seller_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_seller_accounts_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_seller_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := NEW.raw_user_meta_data;
  selected_country_id BIGINT;
BEGIN
  IF COALESCE(meta->>'account_type', '') <> 'seller' THEN
    RETURN NEW;
  END IF;

  selected_country_id := NULLIF(meta->>'country_id', '')::BIGINT;

  IF selected_country_id IS NULL THEN
    RAISE EXCEPTION 'country_id is required for seller registration';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_country_options sco
    WHERE sco.id = selected_country_id
  ) THEN
    RAISE EXCEPTION 'Invalid seller country selection';
  END IF;

  INSERT INTO public.seller_accounts (
    user_id,
    business_name,
    country_id,
    country_name,
    iso_alpha2,
    iso_alpha3,
    isd_code,
    base_currency_code,
    phone
  )
  SELECT
    NEW.id,
    COALESCE(meta->>'business_name', ''),
    c.id,
    c.country_name,
    c.iso_alpha2,
    c.iso_alpha3,
    c.isd_code,
    c.currency_code,
    COALESCE(meta->>'phone', '')
  FROM public.countries c
  WHERE c.id = selected_country_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seller ON auth.users;
CREATE TRIGGER on_auth_user_created_seller
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_seller_user();

-- ---------------------------------------------------------------------------
-- Server-side FX snapshot apply (called by Edge Function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_fx_rate_snapshot(payload JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  INSERT INTO public.fx_rate_metadata (
    id,
    result,
    base_code,
    time_last_update_unix,
    time_last_update_utc,
    time_next_update_unix,
    time_next_update_utc,
    documentation_url,
    terms_of_use_url
  ) VALUES (
    1,
    payload->>'result',
    COALESCE(payload->>'base_code', 'USD'),
    (payload->>'time_last_update_unix')::BIGINT,
    (payload->>'time_last_update_utc')::TIMESTAMPTZ,
    (payload->>'time_next_update_unix')::BIGINT,
    (payload->>'time_next_update_utc')::TIMESTAMPTZ,
    'https://www.exchangerate-api.com/docs',
    'https://www.exchangerate-api.com/terms'
  )
  ON CONFLICT (id) DO UPDATE SET
    result = EXCLUDED.result,
    base_code = EXCLUDED.base_code,
    time_last_update_unix = EXCLUDED.time_last_update_unix,
    time_last_update_utc = EXCLUDED.time_last_update_utc,
    time_next_update_unix = EXCLUDED.time_next_update_unix,
    time_next_update_utc = EXCLUDED.time_next_update_utc,
    documentation_url = EXCLUDED.documentation_url,
    terms_of_use_url = EXCLUDED.terms_of_use_url,
    updated_at = NOW();

  WITH rates AS (
    SELECT
      key AS currency_code,
      (value)::NUMERIC AS fx_rate_usd
    FROM jsonb_each(payload->'conversion_rates')
  )
  UPDATE public.countries c
  SET fx_rate_usd = r.fx_rate_usd
  FROM rates r
  WHERE c.currency_code = r.currency_code;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_fx_rate_snapshot(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_fx_rate_snapshot(JSONB) TO service_role;

-- Hourly FX refresh: deploy Edge Function `refresh-fx-rates`, set EXCHANGERATE_API_KEY secret,
-- then schedule in Supabase Dashboard -> Edge Functions -> refresh-fx-rates -> Cron: `0 * * * *`
