-- OTP-only auth support: seller provisioning after verify, portal email checks

CREATE OR REPLACE FUNCTION public.check_portal_email_registration(
  p_portal TEXT,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
BEGIN
  IF p_portal NOT IN ('buyer', 'seller') THEN
    RAISE EXCEPTION 'Invalid portal.';
  END IF;

  SELECT *
  INTO v_user
  FROM auth.users
  WHERE lower(email) = lower(btrim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  IF EXISTS (SELECT 1 FROM public.buyer_profiles bp WHERE bp.user_id = v_user.id) THEN
    IF p_portal = 'seller' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'This email is registered as a buyer. Use buyer login instead.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'existing_unconfirmed', v_user.email_confirmed_at IS NULL);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.staff_roles sr
    WHERE sr.user_id = v_user.id
      AND sr.role IN ('seller', 'admin')
  ) THEN
    IF p_portal = 'buyer' THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'This email is registered as a seller or admin. Use seller login instead.'
      );
    END IF;

    RETURN jsonb_build_object('allowed', true, 'existing_unconfirmed', v_user.email_confirmed_at IS NULL);
  END IF;

  IF v_user.email_confirmed_at IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'existing_unconfirmed', true);
  END IF;

  RETURN jsonb_build_object(
    'allowed', false,
    'message', 'This email is already registered. Sign in instead.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_seller_registration()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_meta JSONB;
  selected_country_id BIGINT;
  business_name TEXT;
  phone TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT raw_user_meta_data
  INTO v_meta
  FROM auth.users
  WHERE id = v_user_id;

  IF COALESCE(v_meta->>'account_type', '') <> 'seller' THEN
    RAISE EXCEPTION 'This account is not a seller registration.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.buyer_profiles bp WHERE bp.user_id = v_user_id) THEN
    RAISE EXCEPTION 'This email is registered as a buyer and cannot be used for seller access.';
  END IF;

  business_name := BTRIM(COALESCE(v_meta->>'business_name', ''));
  phone := BTRIM(COALESCE(v_meta->>'phone', ''));

  IF business_name = '' THEN
    RAISE EXCEPTION 'Seller business name is missing from registration metadata.';
  END IF;

  IF phone = '' THEN
    RAISE EXCEPTION 'Seller phone is missing from registration metadata.';
  END IF;

  selected_country_id := NULLIF(v_meta->>'country_id', '')::BIGINT;

  IF selected_country_id IS NULL THEN
    RAISE EXCEPTION 'Seller country is missing from registration metadata.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_country_options sco
    WHERE sco.id = selected_country_id
  ) THEN
    RAISE EXCEPTION 'Invalid seller country selection.';
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
    v_user_id,
    business_name,
    c.id,
    c.country_name,
    c.iso_alpha2,
    c.iso_alpha3,
    c.isd_code,
    c.currency_code,
    phone
  FROM public.countries c
  WHERE c.id = selected_country_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    business_name = EXCLUDED.business_name,
    phone = EXCLUDED.phone;

  INSERT INTO public.staff_roles (user_id, role)
  VALUES (v_user_id, 'seller')
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;

  RETURN jsonb_build_object('ok', true, 'role', 'seller');
END;
$$;

REVOKE ALL ON FUNCTION public.check_portal_email_registration(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_seller_registration() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_portal_email_registration(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_seller_registration() TO authenticated;
