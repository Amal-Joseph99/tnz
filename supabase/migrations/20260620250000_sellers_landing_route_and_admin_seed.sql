-- Allow all roles to open the sellers landing page (Sell Now / Become a Seller CTAs)
INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/sellerslandingpage', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;

-- Seed verified admin account (backend-only; not available via public signup)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.guard_auth_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'info@agtrenz.com';
  v_password TEXT := 'Agtrenz@5656';
  v_name TEXT := 'GOODNESS';
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('account_type', 'admin', 'full_name', v_name),
      NOW(),
      NOW(),
      false
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('account_type', 'admin', 'full_name', v_name),
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.staff_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;
END;
$$;

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
