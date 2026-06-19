-- Production auth hardening: role isolation, seller trigger sync, RLS, validation

-- ---------------------------------------------------------------------------
-- Timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS buyer_profiles_set_updated_at ON public.buyer_profiles;
CREATE TRIGGER buyer_profiles_set_updated_at
BEFORE UPDATE ON public.buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- One account type per auth user (buyer XOR staff)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_single_account_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user UUID := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  IF TG_TABLE_NAME = 'buyer_profiles' AND TG_OP IN ('INSERT', 'UPDATE') THEN
    IF EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = target_user) THEN
      RAISE EXCEPTION 'This account is already registered as seller or admin.';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'staff_roles' AND TG_OP IN ('INSERT', 'UPDATE') THEN
    IF EXISTS (SELECT 1 FROM public.buyer_profiles bp WHERE bp.user_id = target_user) THEN
      RAISE EXCEPTION 'This account is already registered as a buyer.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_buyer_profile_account_type ON public.buyer_profiles;
CREATE TRIGGER guard_buyer_profile_account_type
BEFORE INSERT OR UPDATE ON public.buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_single_account_type();

DROP TRIGGER IF EXISTS guard_staff_role_account_type ON public.staff_roles;
CREATE TRIGGER guard_staff_role_account_type
BEFORE INSERT OR UPDATE ON public.staff_roles
FOR EACH ROW
EXECUTE FUNCTION public.guard_single_account_type();

-- ---------------------------------------------------------------------------
-- Seller signup handler (single source of truth — creates seller_accounts + staff role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_seller_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := NEW.raw_user_meta_data;
  selected_country_id BIGINT;
  business_name TEXT := BTRIM(COALESCE(meta->>'business_name', ''));
  phone TEXT := BTRIM(COALESCE(meta->>'phone', ''));
BEGIN
  IF COALESCE(meta->>'account_type', '') <> 'seller' THEN
    RETURN NEW;
  END IF;

  IF business_name = '' THEN
    RAISE EXCEPTION 'business_name is required for seller registration';
  END IF;

  IF phone = '' THEN
    RAISE EXCEPTION 'phone is required for seller registration';
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

  IF EXISTS (SELECT 1 FROM public.buyer_profiles bp WHERE bp.user_id = NEW.id) THEN
    RAISE EXCEPTION 'This email is already registered as a buyer account.';
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
    business_name,
    c.id,
    c.country_name,
    c.iso_alpha2,
    c.iso_alpha3,
    c.isd_code,
    c.currency_code,
    phone
  FROM public.countries c
  WHERE c.id = selected_country_id;

  INSERT INTO public.staff_roles (user_id, role)
  VALUES (NEW.id, 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_seller ON auth.users;
CREATE TRIGGER on_auth_user_created_seller
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_seller_user();

-- ---------------------------------------------------------------------------
-- Buyer signup handler (validation)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_buyer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := NEW.raw_user_meta_data;
  full_name TEXT := BTRIM(COALESCE(meta->>'full_name', ''));
BEGIN
  IF COALESCE(meta->>'account_type', '') <> 'buyer' THEN
    RETURN NEW;
  END IF;

  IF full_name = '' THEN
    RAISE EXCEPTION 'full_name is required for buyer registration';
  END IF;

  IF EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = NEW.id) THEN
    RAISE EXCEPTION 'This email is already registered as seller or admin.';
  END IF;

  INSERT INTO public.buyer_profiles (user_id, full_name)
  VALUES (NEW.id, full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_buyer ON auth.users;
CREATE TRIGGER on_auth_user_created_buyer
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_buyer_user();

-- ---------------------------------------------------------------------------
-- Seller account updates (business name + phone only; country/currency locked)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Sellers update own account" ON public.seller_accounts;
CREATE POLICY "Sellers update own account"
ON public.seller_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.guard_seller_account_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF BTRIM(NEW.business_name) = '' THEN
    RAISE EXCEPTION 'Business name cannot be empty.';
  END IF;

  IF BTRIM(NEW.phone) = '' THEN
    RAISE EXCEPTION 'Phone number cannot be empty.';
  END IF;

  NEW.business_name := BTRIM(NEW.business_name);
  NEW.phone := BTRIM(NEW.phone);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_accounts_validate_update ON public.seller_accounts;
CREATE TRIGGER seller_accounts_validate_update
BEFORE UPDATE ON public.seller_accounts
FOR EACH ROW
EXECUTE FUNCTION public.guard_seller_account_update();

-- ---------------------------------------------------------------------------
-- Auth helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_seller_account()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_roles sr
    WHERE sr.user_id = auth.uid()
      AND sr.role = 'seller'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_account()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_roles sr
    WHERE sr.user_id = auth.uid()
      AND sr.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_email_confirmed()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT u.email_confirmed_at IS NOT NULL
      FROM auth.users u
      WHERE u.id = auth.uid()
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_seller_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_email_confirmed() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_seller_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_confirmed() TO authenticated;

CREATE INDEX IF NOT EXISTS staff_roles_role_idx ON public.staff_roles (role);

-- Manual admin creation (backend only — after creating auth user in Supabase dashboard):
-- INSERT INTO public.staff_roles (user_id, role) VALUES ('<auth-user-uuid>', 'admin');
