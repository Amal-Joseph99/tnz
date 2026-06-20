-- Storefront currency config, display metadata, admin selector, and session resolution RPCs

CREATE TABLE IF NOT EXISTS public.app_currency_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_currency_code CHAR(3) NOT NULL,
  storefront_default_currency_code CHAR(3) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_currency_config (base_currency_code, storefront_default_currency_code)
VALUES ('USD', 'USD')
ON CONFLICT (id) DO UPDATE
SET base_currency_code = EXCLUDED.base_currency_code,
    storefront_default_currency_code = EXCLUDED.storefront_default_currency_code,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.currency_display_settings (
  currency_code CHAR(3) PRIMARY KEY REFERENCES public.countries (currency_code),
  symbol TEXT NOT NULL,
  decimal_places SMALLINT NOT NULL CHECK (decimal_places >= 0 AND decimal_places <= 4)
);

INSERT INTO public.currency_display_settings (currency_code, symbol, decimal_places)
SELECT
  c.currency_code,
  c.currency_code,
  CASE
    WHEN c.currency_code IN ('JPY', 'KRW', 'VND', 'IDR', 'CLP', 'PYG', 'UGX', 'RWF', 'GNF', 'XAF', 'XOF', 'XPF') THEN 0
    ELSE 2
  END
FROM public.countries c
ON CONFLICT (currency_code) DO NOTHING;

UPDATE public.currency_display_settings SET symbol = '$', decimal_places = 2 WHERE currency_code = 'USD';
UPDATE public.currency_display_settings SET symbol = '€', decimal_places = 2 WHERE currency_code = 'EUR';
UPDATE public.currency_display_settings SET symbol = '£', decimal_places = 2 WHERE currency_code = 'GBP';
UPDATE public.currency_display_settings SET symbol = '₹', decimal_places = 2 WHERE currency_code = 'INR';
UPDATE public.currency_display_settings SET symbol = '₦', decimal_places = 2 WHERE currency_code = 'NGN';
UPDATE public.currency_display_settings SET symbol = '¥', decimal_places = 0 WHERE currency_code = 'JPY';
UPDATE public.currency_display_settings SET symbol = '₩', decimal_places = 0 WHERE currency_code = 'KRW';
UPDATE public.currency_display_settings SET symbol = '₫', decimal_places = 0 WHERE currency_code = 'VND';
UPDATE public.currency_display_settings SET symbol = 'Rp', decimal_places = 0 WHERE currency_code = 'IDR';
UPDATE public.currency_display_settings SET symbol = 'CA$', decimal_places = 2 WHERE currency_code = 'CAD';
UPDATE public.currency_display_settings SET symbol = 'A$', decimal_places = 2 WHERE currency_code = 'AUD';
UPDATE public.currency_display_settings SET symbol = 'AED ', decimal_places = 2 WHERE currency_code = 'AED';
UPDATE public.currency_display_settings SET symbol = 'SAR ', decimal_places = 2 WHERE currency_code = 'SAR';
UPDATE public.currency_display_settings SET symbol = 'S$', decimal_places = 2 WHERE currency_code = 'SGD';
UPDATE public.currency_display_settings SET symbol = 'CHF ', decimal_places = 2 WHERE currency_code = 'CHF';

CREATE TABLE IF NOT EXISTS public.admin_currency_selector_options (
  currency_code CHAR(3) PRIMARY KEY REFERENCES public.countries (currency_code),
  display_label TEXT NOT NULL,
  sort_order INT NOT NULL
);

INSERT INTO public.admin_currency_selector_options (currency_code, display_label, sort_order)
VALUES
  ('USD', 'USD', 1),
  ('INR', 'INR', 2),
  ('NGN', 'NAIRA', 3),
  ('GBP', 'GB', 4),
  ('EUR', 'EU', 5)
ON CONFLICT (currency_code) DO UPDATE
SET display_label = EXCLUDED.display_label,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.admin_user_currency_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  currency_code CHAR(3) NOT NULL REFERENCES public.countries (currency_code),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_currency_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_currency_selector_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_currency_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read currency config" ON public.app_currency_config;
CREATE POLICY "Public read currency config"
ON public.app_currency_config
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read currency display settings" ON public.currency_display_settings;
CREATE POLICY "Public read currency display settings"
ON public.currency_display_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read admin currency options" ON public.admin_currency_selector_options;
CREATE POLICY "Public read admin currency options"
ON public.admin_currency_selector_options
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins read own currency preference" ON public.admin_user_currency_preferences;
CREATE POLICY "Admins read own currency preference"
ON public.admin_user_currency_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_admin_account());

DROP POLICY IF EXISTS "Admins upsert own currency preference" ON public.admin_user_currency_preferences;
CREATE POLICY "Admins upsert own currency preference"
ON public.admin_user_currency_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_admin_account());

DROP POLICY IF EXISTS "Admins update own currency preference" ON public.admin_user_currency_preferences;
CREATE POLICY "Admins update own currency preference"
ON public.admin_user_currency_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_admin_account())
WITH CHECK (auth.uid() = user_id AND public.is_admin_account());

GRANT SELECT ON public.app_currency_config TO anon, authenticated;
GRANT SELECT ON public.currency_display_settings TO anon, authenticated;
GRANT SELECT ON public.admin_currency_selector_options TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_user_currency_preferences TO authenticated;

CREATE OR REPLACE FUNCTION public.get_storefront_currency_config()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'base_currency_code', base_currency_code,
    'storefront_default_currency_code', storefront_default_currency_code
  )
  FROM public.app_currency_config
  WHERE id = 1;
$$;

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
  SELECT c.fx_rate_usd
  INTO v_rate
  FROM public.countries c
  WHERE c.currency_code = v_currency
    AND c.is_active = true;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Currency % is not configured in countries table', v_currency;
  END IF;

  SELECT cds.symbol, cds.decimal_places
  INTO v_symbol, v_decimals
  FROM public.currency_display_settings cds
  WHERE cds.currency_code = v_currency;

  IF v_symbol IS NULL THEN
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

CREATE OR REPLACE FUNCTION public.resolve_currency_by_country(p_iso_alpha2 TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency TEXT;
BEGIN
  SELECT sco.currency_code
  INTO v_currency
  FROM public.seller_country_options sco
  WHERE sco.iso_alpha2 = upper(btrim(p_iso_alpha2))
  LIMIT 1;

  IF v_currency IS NULL THEN
    RAISE EXCEPTION 'Country % is not configured', p_iso_alpha2;
  END IF;

  RETURN public.get_currency_package(v_currency);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_session_display_currency(
  p_country_iso_alpha2 TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_currency TEXT;
  v_default TEXT;
BEGIN
  SELECT storefront_default_currency_code
  INTO v_default
  FROM public.app_currency_config
  WHERE id = 1;

  IF v_default IS NULL THEN
    RAISE EXCEPTION 'Storefront currency config is missing';
  END IF;

  IF auth.uid() IS NULL THEN
    v_role := 'guest';
  ELSE
    v_role := public.get_account_type();
  END IF;

  IF v_role = 'admin' THEN
    SELECT p.currency_code
    INTO v_currency
    FROM public.admin_user_currency_preferences p
    WHERE p.user_id = auth.uid();

    IF v_currency IS NULL THEN
      SELECT acc.base_currency_code
      INTO v_currency
      FROM public.app_currency_config acc
      WHERE acc.id = 1;
    END IF;

    RETURN public.get_currency_package(v_currency);
  END IF;

  IF v_role = 'seller' THEN
    SELECT sa.base_currency_code
    INTO v_currency
    FROM public.seller_accounts sa
    WHERE sa.user_id = auth.uid();

    IF v_currency IS NULL THEN
      RAISE EXCEPTION 'Seller base currency is not configured';
    END IF;

    RETURN public.get_currency_package(v_currency);
  END IF;

  IF p_country_iso_alpha2 IS NOT NULL AND btrim(p_country_iso_alpha2) <> '' THEN
    RETURN public.resolve_currency_by_country(p_country_iso_alpha2);
  END IF;

  RETURN public.get_currency_package(v_default);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_currency_selector_options()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'currency_code', o.currency_code,
        'display_label', o.display_label,
        'sort_order', o.sort_order
      )
      ORDER BY o.sort_order
    ),
    '[]'::jsonb
  )
  FROM public.admin_currency_selector_options o;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_currency_preference(p_currency_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency TEXT := upper(btrim(p_currency_code));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_currency_selector_options o
    WHERE o.currency_code = v_currency
  ) THEN
    RAISE EXCEPTION 'Currency % is not allowed for admin selector', v_currency;
  END IF;

  INSERT INTO public.admin_user_currency_preferences (user_id, currency_code)
  VALUES (auth.uid(), v_currency)
  ON CONFLICT (user_id) DO UPDATE
  SET currency_code = EXCLUDED.currency_code,
      updated_at = NOW();

  RETURN public.get_currency_package(v_currency);
END;
$$;

REVOKE ALL ON FUNCTION public.get_storefront_currency_config() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_currency_package(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_currency_by_country(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_session_display_currency(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_currency_selector_options() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_admin_currency_preference(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_storefront_currency_config() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_currency_package(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_currency_by_country(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_session_display_currency(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_currency_selector_options() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_currency_preference(TEXT) TO authenticated;
