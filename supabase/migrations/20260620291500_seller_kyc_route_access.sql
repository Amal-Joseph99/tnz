-- Allow sellers to access the KYC verification wizard routes.

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/seller/kyc', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/kyc/step/*', ARRAY['seller'], '/seller/dashboard', 80)
ON CONFLICT (path_pattern) DO NOTHING;

UPDATE public.help_topics
SET link_path = '/seller/kyc'
WHERE portal_key = 'seller' AND topic_key = 'kyc' AND link_path = '/seller/profile';
