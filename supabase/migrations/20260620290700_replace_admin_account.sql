-- Replace seeded admin account with verified info@agtrenz.com (GOODNESS)

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
  v_password TEXT := 'Akhi@5656';
  v_name TEXT := 'GOODNESS';
  v_admin_user UUID;
BEGIN
  FOR v_admin_user IN
    SELECT user_id FROM public.staff_roles WHERE role = 'admin'
  LOOP
    DELETE FROM public.admin_user_currency_preferences WHERE user_id = v_admin_user;
    DELETE FROM public.app_notifications WHERE user_id = v_admin_user;
    DELETE FROM public.staff_roles WHERE user_id = v_admin_user AND role = 'admin';
  END LOOP;

  FOR v_admin_user IN
    SELECT u.id
    FROM auth.users u
    WHERE COALESCE(u.raw_user_meta_data->>'account_type', '') = 'admin'
  LOOP
    DELETE FROM auth.identities WHERE user_id = v_admin_user;
    DELETE FROM auth.users WHERE id = v_admin_user;
  END LOOP;

  DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower(v_email));

  DELETE FROM public.admin_user_currency_preferences
  WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower(v_email));

  DELETE FROM public.app_notifications
  WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower(v_email));

  DELETE FROM public.staff_roles
  WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower(v_email));

  DELETE FROM auth.users WHERE lower(email) = lower(v_email);

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
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    phone_change,
    phone_change_token,
    reauthentication_token,
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
    '',
    '',
    '',
    '',
    '',
    '',
    '',
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
