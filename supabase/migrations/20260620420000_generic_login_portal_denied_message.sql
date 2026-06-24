-- Admin on buyer login: generic denial (do not reveal admin account type).
-- Seller/buyer wrong-portal: keep existing role-specific redirect messages.

CREATE OR REPLACE FUNCTION public.verify_login_portal(p_portal TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_role_label TEXT;
  v_login_path TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'message', 'Not signed in.');
  END IF;

  v_role := public.get_account_type();

  IF p_portal = 'buyer' AND v_role = 'buyer' THEN
    RETURN jsonb_build_object('allowed', true, 'role', v_role);
  END IF;

  IF p_portal = 'seller' AND v_role IN ('seller', 'admin') THEN
    RETURN jsonb_build_object('allowed', true, 'role', v_role);
  END IF;

  IF v_role = 'admin' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'message', 'ACCESS RESTRICTED, PLEASE ENTER YOUR EMAIL AND PASSWORD'
    );
  END IF;

  SELECT display_label, login_path
  INTO v_role_label, v_login_path
  FROM public.app_portal_config
  WHERE portal_key = v_role;

  IF v_role_label IS NULL THEN
    v_role_label := UPPER(v_role);
    v_login_path := '/';
  END IF;

  RETURN jsonb_build_object(
    'allowed', false,
    'actual_role', v_role,
    'message', format(
      'THIS EMAIL IS REGISTERED AS %s, PLEASE USE %s LOGIN PAGE TO ACCESS YOUR ACCOUNT',
      v_role_label,
      v_role_label
    ),
    'redirect_path', v_login_path
  );
END;
$$;
