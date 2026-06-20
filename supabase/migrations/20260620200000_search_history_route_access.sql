-- Search history, route access rules, dialog messages, and portal verification (backend-driven config)

CREATE TABLE IF NOT EXISTS public.user_search_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  search_input TEXT NOT NULL,
  product_id BIGINT REFERENCES public.seller_products (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_search_history_user_searched_at_idx
ON public.user_search_history (user_id, searched_at DESC);

ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own search history" ON public.user_search_history;
CREATE POLICY "Users read own search history"
ON public.user_search_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own search history" ON public.user_search_history;
CREATE POLICY "Users insert own search history"
ON public.user_search_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own search history" ON public.user_search_history;
CREATE POLICY "Users delete own search history"
ON public.user_search_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.user_search_history TO authenticated;

CREATE TABLE IF NOT EXISTS public.app_portal_config (
  portal_key TEXT PRIMARY KEY CHECK (portal_key IN ('buyer', 'seller', 'admin')),
  login_path TEXT NOT NULL,
  display_label TEXT NOT NULL
);

INSERT INTO public.app_portal_config (portal_key, login_path, display_label)
VALUES
  ('buyer', '/buyer/signin', 'BUYER'),
  ('seller', '/seller/signin', 'SELLER'),
  ('admin', '/seller/signin', 'ADMIN')
ON CONFLICT (portal_key) DO UPDATE
SET login_path = EXCLUDED.login_path,
    display_label = EXCLUDED.display_label;

CREATE TABLE IF NOT EXISTS public.app_route_access_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  path_pattern TEXT NOT NULL UNIQUE,
  allowed_roles TEXT[] NOT NULL,
  redirect_path TEXT,
  priority INT NOT NULL DEFAULT 0
);

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/buyer/signin', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/buyer/signup', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/buyer/verify-email', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/buyer/forgot-password', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/buyer/forgot-password/verify', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/buyer/reset-password', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/signin', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/signup', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/verify-email', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/forgot-password', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/forgot-password/verify', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/seller/reset-password', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/signin', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/signup', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 100),
  ('/admin/*', ARRAY['admin'], '/admin/dashboard', 90),
  ('/seller/dashboard', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/profile', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/warehouse', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/products', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/orders', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/wallet', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/help', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/terms-policies', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/notifications', ARRAY['seller'], '/seller/dashboard', 80),
  ('/', ARRAY['guest', 'buyer'], '/', 10),
  ('/search', ARRAY['guest', 'buyer'], '/', 10),
  ('/product/*', ARRAY['guest', 'buyer'], '/', 10),
  ('/category/*', ARRAY['guest', 'buyer'], '/', 10),
  ('/categories', ARRAY['guest', 'buyer'], '/', 10),
  ('/privacy-policy', ARRAY['guest', 'buyer'], '/', 10),
  ('/terms-of-service', ARRAY['guest', 'buyer'], '/', 10),
  ('/cookies-settings', ARRAY['guest', 'buyer'], '/', 10)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;

CREATE TABLE IF NOT EXISTS public.app_dialog_messages (
  action_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  confirm_label TEXT NOT NULL DEFAULT 'Confirm',
  cancel_label TEXT NOT NULL DEFAULT 'Cancel',
  redirect_path TEXT
);

INSERT INTO public.app_dialog_messages (action_key, title, message, confirm_label, cancel_label, redirect_path)
VALUES
  (
    'sign_out',
    'Sign out',
    'Are you sure you want to sign out of your account?',
    'Sign out',
    'Cancel',
    NULL
  ),
  (
    'delete',
    'Delete',
    'Are you sure you want to delete {{item_label}}? This action cannot be undone.',
    'Delete',
    'Cancel',
    NULL
  ),
  (
    'remove',
    'Remove',
    'Are you sure you want to remove {{item_label}}?',
    'Remove',
    'Cancel',
    NULL
  ),
  (
    'guest_add_to_cart',
    'Create an account',
    'Sign up for a buyer account to add items to your cart and checkout.',
    'Sign up',
    'Cancel',
    '/buyer/signup'
  ),
  (
    'console_sign_out',
    'Leave dashboard',
    'Leaving the dashboard will sign you out. Continue?',
    'Sign out',
    'Stay',
  '/seller/signin'
  )
ON CONFLICT (action_key) DO UPDATE
SET title = EXCLUDED.title,
    message = EXCLUDED.message,
    confirm_label = EXCLUDED.confirm_label,
    cancel_label = EXCLUDED.cancel_label,
    redirect_path = EXCLUDED.redirect_path;

ALTER TABLE public.app_portal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_route_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_dialog_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read portal config" ON public.app_portal_config;
CREATE POLICY "Public read portal config"
ON public.app_portal_config
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read route access rules" ON public.app_route_access_rules;
CREATE POLICY "Public read route access rules"
ON public.app_route_access_rules
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read dialog messages" ON public.app_dialog_messages;
CREATE POLICY "Public read dialog messages"
ON public.app_dialog_messages
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.app_portal_config TO anon, authenticated;
GRANT SELECT ON public.app_route_access_rules TO anon, authenticated;
GRANT SELECT ON public.app_dialog_messages TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.path_matches_route_pattern(p_path TEXT, p_pattern TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN right(p_pattern, 2) = '/*' THEN p_path = left(p_pattern, length(p_pattern) - 1)
      OR p_path LIKE left(p_pattern, length(p_pattern) - 1) || '%'
    ELSE p_path = p_pattern
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_route_access(p_path TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := 'guest';
  v_rule public.app_route_access_rules%ROWTYPE;
  v_allowed BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    v_role := COALESCE(NULLIF(public.get_account_type(), 'unknown'), 'guest');
  END IF;

  SELECT *
  INTO v_rule
  FROM public.app_route_access_rules
  WHERE public.path_matches_route_pattern(p_path, path_pattern)
  ORDER BY priority DESC, length(path_pattern) DESC
  LIMIT 1;

  IF FOUND THEN
    v_allowed := v_role = ANY (v_rule.allowed_roles);
    IF v_allowed THEN
      RETURN jsonb_build_object('allowed', true, 'role', v_role);
    END IF;

    RETURN jsonb_build_object(
      'allowed', false,
      'role', v_role,
      'redirect_path', CASE v_role
        WHEN 'seller' THEN '/seller/dashboard'
        WHEN 'admin' THEN '/admin/dashboard'
        WHEN 'buyer' THEN '/'
        ELSE '/'
      END
    );
  END IF;

  IF v_role = 'buyer' THEN
    RETURN jsonb_build_object('allowed', true, 'role', v_role);
  END IF;

  IF v_role = 'seller' THEN
    RETURN jsonb_build_object('allowed', false, 'role', v_role, 'redirect_path', '/seller/dashboard');
  END IF;

  IF v_role = 'admin' THEN
    RETURN jsonb_build_object('allowed', false, 'role', v_role, 'redirect_path', '/admin/dashboard');
  END IF;

  RETURN jsonb_build_object('allowed', false, 'role', v_role, 'redirect_path', '/');
END;
$$;

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

CREATE OR REPLACE FUNCTION public.record_search_history(
  p_search_input TEXT,
  p_product_id BIGINT DEFAULT NULL,
  p_product_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_input TEXT := btrim(p_search_input);
  v_name TEXT := COALESCE(NULLIF(btrim(p_product_name), ''), v_input);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_input = '' THEN
    RAISE EXCEPTION 'Search input is required';
  END IF;

  INSERT INTO public.user_search_history (user_id, search_input, product_id, product_name)
  VALUES (auth.uid(), v_input, p_product_id, v_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dialog_message(p_action_key TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(row)
  FROM (
    SELECT action_key, title, message, confirm_label, cancel_label, redirect_path
    FROM public.app_dialog_messages
    WHERE action_key = p_action_key
    LIMIT 1
  ) AS row;
$$;

REVOKE ALL ON FUNCTION public.resolve_route_access(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_login_portal(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_search_history(TEXT, BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dialog_message(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.path_matches_route_pattern(TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.resolve_route_access(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_login_portal(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_search_history(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dialog_message(TEXT) TO anon, authenticated;
