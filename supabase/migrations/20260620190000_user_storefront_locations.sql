-- Persist storefront location for signed-in users (city, state, country)

CREATE TABLE IF NOT EXISTS public.user_storefront_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  city TEXT,
  state TEXT,
  country TEXT,
  country_code CHAR(2),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_label TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_storefront_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own storefront location" ON public.user_storefront_locations;
CREATE POLICY "Users read own storefront location"
ON public.user_storefront_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own storefront location" ON public.user_storefront_locations;
CREATE POLICY "Users insert own storefront location"
ON public.user_storefront_locations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own storefront location" ON public.user_storefront_locations;
CREATE POLICY "Users update own storefront location"
ON public.user_storefront_locations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS user_storefront_locations_set_updated_at ON public.user_storefront_locations;
CREATE TRIGGER user_storefront_locations_set_updated_at
BEFORE UPDATE ON public.user_storefront_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.user_storefront_locations TO authenticated;
