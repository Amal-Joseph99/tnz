-- Role-based auth: buyer profiles, staff roles, signup guards, RPC helpers

-- ---------------------------------------------------------------------------
-- Account role tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers read own profile" ON public.buyer_profiles;
CREATE POLICY "Buyers read own profile"
ON public.buyer_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Buyers update own profile" ON public.buyer_profiles;
CREATE POLICY "Buyers update own profile"
ON public.buyer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.staff_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_roles_one_per_user UNIQUE (user_id)
);

ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read own role" ON public.staff_roles;
CREATE POLICY "Staff read own role"
ON public.staff_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Block admin self-registration; allow only buyer | seller from frontend
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_auth_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_type TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', '');
BEGIN
  IF account_type = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts can only be created from the Supabase backend.';
  END IF;

  IF account_type NOT IN ('buyer', 'seller') THEN
    RAISE EXCEPTION 'Invalid account type. Use buyer or seller registration only.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_auth_user_signup ON auth.users;
CREATE TRIGGER guard_auth_user_signup
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_auth_user_signup();

-- ---------------------------------------------------------------------------
-- Buyer profile on signup (account_type = buyer)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_buyer_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := NEW.raw_user_meta_data;
BEGIN
  IF COALESCE(meta->>'account_type', '') <> 'buyer' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.buyer_profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(meta->>'full_name', ''), 'Buyer')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_buyer ON auth.users;
CREATE TRIGGER on_auth_user_created_buyer
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_buyer_user();

-- ---------------------------------------------------------------------------
-- Seller signup also registers staff role = seller (admin inserted manually only)
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

  INSERT INTO public.staff_roles (user_id, role)
  VALUES (NEW.id, 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Auth RPC helpers (used by frontend — no secrets exposed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.staff_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_buyer_account()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.buyer_profiles
    WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_account_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = auth.uid() AND sr.role = 'admin') THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.staff_roles sr WHERE sr.user_id = auth.uid() AND sr.role = 'seller') THEN 'seller'
    WHEN EXISTS (SELECT 1 FROM public.buyer_profiles bp WHERE bp.user_id = auth.uid()) THEN 'buyer'
    ELSE COALESCE(auth.jwt()->'user_metadata'->>'account_type', 'unknown')
  END;
$$;

REVOKE ALL ON FUNCTION public.get_staff_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_buyer_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_account_type() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_buyer_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_type() TO authenticated;

-- Manual admin creation (backend only — run in SQL Editor after creating auth user):
-- INSERT INTO public.staff_roles (user_id, role) VALUES ('<auth-user-uuid>', 'admin');
