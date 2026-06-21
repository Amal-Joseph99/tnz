-- Full seller warehouse setup: reference data, structured address, map coordinates, admin listing.

CREATE TABLE IF NOT EXISTS public.warehouse_address_tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tag_code TEXT NOT NULL UNIQUE,
  tag_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.warehouse_contact_roles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_code TEXT NOT NULL UNIQUE,
  role_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.warehouse_weekdays (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  day_code TEXT NOT NULL UNIQUE,
  day_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.warehouse_time_slots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_time TIME NOT NULL UNIQUE,
  slot_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.warehouse_address_tags (tag_code, tag_label, sort_order)
VALUES
  ('home', 'Home', 10),
  ('work', 'Work', 20),
  ('warehouse', 'Warehouse', 30),
  ('other', 'Other', 40)
ON CONFLICT (tag_code) DO UPDATE
SET tag_label = EXCLUDED.tag_label,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

INSERT INTO public.warehouse_contact_roles (role_code, role_label, sort_order)
VALUES
  ('warehouse_manager', 'Warehouse Manager', 10),
  ('assistant', 'Assistant', 20),
  ('helper', 'Helper', 30)
ON CONFLICT (role_code) DO UPDATE
SET role_label = EXCLUDED.role_label,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

INSERT INTO public.warehouse_weekdays (day_code, day_label, sort_order)
VALUES
  ('monday', 'Monday', 10),
  ('tuesday', 'Tuesday', 20),
  ('wednesday', 'Wednesday', 30),
  ('thursday', 'Thursday', 40),
  ('friday', 'Friday', 50),
  ('saturday', 'Saturday', 60),
  ('sunday', 'Sunday', 70)
ON CONFLICT (day_code) DO UPDATE
SET day_label = EXCLUDED.day_label,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

INSERT INTO public.warehouse_time_slots (slot_time, slot_label, sort_order)
SELECT slot_time, slot_label, sort_order
FROM (
  VALUES
    ('06:00'::TIME, '6:00 AM', 60),
    ('07:00'::TIME, '7:00 AM', 70),
    ('08:00'::TIME, '8:00 AM', 80),
    ('09:00'::TIME, '9:00 AM', 90),
    ('10:00'::TIME, '10:00 AM', 100),
    ('11:00'::TIME, '11:00 AM', 110),
    ('12:00'::TIME, '12:00 PM', 120),
    ('13:00'::TIME, '1:00 PM', 130),
    ('14:00'::TIME, '2:00 PM', 140),
    ('15:00'::TIME, '3:00 PM', 150),
    ('16:00'::TIME, '4:00 PM', 160),
    ('17:00'::TIME, '5:00 PM', 170),
    ('18:00'::TIME, '6:00 PM', 180),
    ('19:00'::TIME, '7:00 PM', 190),
    ('20:00'::TIME, '8:00 PM', 200)
) AS seed(slot_time, slot_label, sort_order)
ON CONFLICT (slot_time) DO UPDATE
SET slot_label = EXCLUDED.slot_label,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

ALTER TABLE public.seller_warehouses
  ADD COLUMN IF NOT EXISTS warehouse_id CHAR(12),
  ADD COLUMN IF NOT EXISTS address_tag_id BIGINT REFERENCES public.warehouse_address_tags (id),
  ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_name TEXT,
  ADD COLUMN IF NOT EXISTS country_name TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_label TEXT,
  ADD COLUMN IF NOT EXISTS location_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_role_id BIGINT REFERENCES public.warehouse_contact_roles (id),
  ADD COLUMN IF NOT EXISTS operational_days TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS opening_time TIME,
  ADD COLUMN IF NOT EXISTS closing_time TIME,
  ADD COLUMN IF NOT EXISTS is_supplier_address BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_gstin TEXT;

UPDATE public.seller_warehouses
SET
  address_line_1 = COALESCE(NULLIF(BTRIM(address_line_1), ''), address_line),
  city = COALESCE(NULLIF(BTRIM(city), ''), 'Unknown'),
  state_name = COALESCE(NULLIF(BTRIM(state_name), ''), 'Unknown'),
  country_name = COALESCE(NULLIF(BTRIM(country_name), ''), 'India')
WHERE address_line_1 IS NULL OR city IS NULL OR state_name IS NULL OR country_name IS NULL;

CREATE OR REPLACE FUNCTION public.generate_warehouse_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate TEXT;
  i INT;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..12 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.seller_warehouses
      WHERE warehouse_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_seller_warehouse_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.warehouse_id IS NULL OR BTRIM(NEW.warehouse_id) = '' THEN
    NEW.warehouse_id := public.generate_warehouse_id();
  END IF;

  NEW.address_line_1 := NULLIF(BTRIM(COALESCE(NEW.address_line_1, NEW.address_line, '')), '');
  NEW.landmark := NULLIF(BTRIM(COALESCE(NEW.landmark, '')), '');
  NEW.city := NULLIF(BTRIM(COALESCE(NEW.city, '')), '');
  NEW.state_name := NULLIF(BTRIM(COALESCE(NEW.state_name, '')), '');
  NEW.country_name := NULLIF(BTRIM(COALESCE(NEW.country_name, '')), '');
  NEW.contact_name := NULLIF(BTRIM(COALESCE(NEW.contact_name, '')), '');
  NEW.contact_email := NULLIF(BTRIM(LOWER(COALESCE(NEW.contact_email, ''))), '');
  NEW.contact_phone := NULLIF(BTRIM(COALESCE(NEW.contact_phone, '')), '');
  NEW.supplier_name := NULLIF(BTRIM(COALESCE(NEW.supplier_name, '')), '');
  NEW.supplier_gstin := NULLIF(UPPER(BTRIM(COALESCE(NEW.supplier_gstin, ''))), '');
  NEW.location_label := NULLIF(BTRIM(COALESCE(NEW.location_label, '')), '');

  IF NEW.address_line_1 IS NOT NULL THEN
    NEW.address_line := NEW.address_line_1 || CASE
      WHEN NEW.landmark IS NOT NULL THEN ', ' || NEW.landmark
      ELSE ''
    END;
  END IF;

  IF NEW.warehouse_name IS NULL OR BTRIM(NEW.warehouse_name) = '' THEN
    NEW.warehouse_name := COALESCE(
      (
        SELECT wat.tag_label
        FROM public.warehouse_address_tags wat
        WHERE wat.id = NEW.address_tag_id
      ),
      'Warehouse'
    ) || CASE
      WHEN NEW.city IS NOT NULL THEN ' - ' || NEW.city
      ELSE ''
    END;
  END IF;

  IF NEW.closing_time IS NOT NULL THEN
    NEW.dispatch_cutoff_time := NEW.closing_time;
  END IF;

  IF NEW.is_supplier_address IS NOT TRUE THEN
    NEW.supplier_name := NULL;
    NEW.supplier_gstin := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_warehouses_assign_defaults ON public.seller_warehouses;
CREATE TRIGGER seller_warehouses_assign_defaults
BEFORE INSERT OR UPDATE ON public.seller_warehouses
FOR EACH ROW
EXECUTE FUNCTION public.assign_seller_warehouse_defaults();

UPDATE public.seller_warehouses
SET warehouse_id = public.generate_warehouse_id()
WHERE warehouse_id IS NULL;

ALTER TABLE public.seller_warehouses
  ALTER COLUMN warehouse_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS seller_warehouses_warehouse_id_uidx
ON public.seller_warehouses (warehouse_id);

ALTER TABLE public.seller_warehouses
  DROP CONSTRAINT IF EXISTS seller_warehouses_fields_not_empty;

ALTER TABLE public.seller_warehouses
  ADD CONSTRAINT seller_warehouses_fields_not_empty CHECK (
    BTRIM(warehouse_name) <> ''
    AND BTRIM(COALESCE(address_line_1, address_line, '')) <> ''
    AND BTRIM(postal_code) <> ''
    AND dispatch_cutoff_time IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.list_warehouse_form_options()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'addressTags',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', wat.id,
            'code', wat.tag_code,
            'label', wat.tag_label,
            'sortOrder', wat.sort_order
          )
          ORDER BY wat.sort_order, wat.id
        )
        FROM public.warehouse_address_tags wat
        WHERE wat.is_active
      ),
      '[]'::jsonb
    ),
    'contactRoles',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', wcr.id,
            'code', wcr.role_code,
            'label', wcr.role_label,
            'sortOrder', wcr.sort_order
          )
          ORDER BY wcr.sort_order, wcr.id
        )
        FROM public.warehouse_contact_roles wcr
        WHERE wcr.is_active
      ),
      '[]'::jsonb
    ),
    'weekdays',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ww.id,
            'code', ww.day_code,
            'label', ww.day_label,
            'sortOrder', ww.sort_order
          )
          ORDER BY ww.sort_order, ww.id
        )
        FROM public.warehouse_weekdays ww
        WHERE ww.is_active
      ),
      '[]'::jsonb
    ),
    'timeSlots',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', wts.id,
            'time', to_char(wts.slot_time, 'HH24:MI'),
            'label', wts.slot_label,
            'sortOrder', wts.sort_order
          )
          ORDER BY wts.sort_order, wts.id
        )
        FROM public.warehouse_time_slots wts
        WHERE wts.is_active
      ),
      '[]'::jsonb
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.list_admin_warehouses()
RETURNS TABLE (
  user_id UUID,
  seller_email TEXT,
  business_name TEXT,
  warehouse_id TEXT,
  address_tag_label TEXT,
  address_line_1 TEXT,
  landmark TEXT,
  postal_code TEXT,
  city TEXT,
  state_name TEXT,
  country_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_label TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role_label TEXT,
  operational_days TEXT[],
  opening_time TEXT,
  closing_time TEXT,
  is_supplier_address BOOLEAN,
  supplier_name TEXT,
  supplier_gstin TEXT,
  is_completed BOOLEAN,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN QUERY
  SELECT
    w.user_id,
    u.email::TEXT,
    sa.business_name,
    w.warehouse_id::TEXT,
    wat.tag_label,
    COALESCE(w.address_line_1, w.address_line),
    w.landmark,
    w.postal_code,
    w.city,
    w.state_name,
    w.country_name,
    w.latitude,
    w.longitude,
    w.location_label,
    w.contact_name,
    w.contact_email,
    w.contact_phone,
    wcr.role_label,
    w.operational_days,
    to_char(w.opening_time, 'HH24:MI'),
    to_char(w.closing_time, 'HH24:MI'),
    w.is_supplier_address,
    w.supplier_name,
    w.supplier_gstin,
    w.is_completed,
    w.updated_at
  FROM public.seller_warehouses w
  JOIN auth.users u ON u.id = w.user_id
  LEFT JOIN public.seller_accounts sa ON sa.user_id = w.user_id
  LEFT JOIN public.warehouse_address_tags wat ON wat.id = w.address_tag_id
  LEFT JOIN public.warehouse_contact_roles wcr ON wcr.id = w.contact_role_id
  ORDER BY w.updated_at DESC;
END;
$$;

ALTER TABLE public.warehouse_address_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_contact_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read warehouse address tags" ON public.warehouse_address_tags;
CREATE POLICY "Public read warehouse address tags"
ON public.warehouse_address_tags
FOR SELECT
TO anon, authenticated
USING (is_active);

DROP POLICY IF EXISTS "Public read warehouse contact roles" ON public.warehouse_contact_roles;
CREATE POLICY "Public read warehouse contact roles"
ON public.warehouse_contact_roles
FOR SELECT
TO anon, authenticated
USING (is_active);

DROP POLICY IF EXISTS "Public read warehouse weekdays" ON public.warehouse_weekdays;
CREATE POLICY "Public read warehouse weekdays"
ON public.warehouse_weekdays
FOR SELECT
TO anon, authenticated
USING (is_active);

DROP POLICY IF EXISTS "Public read warehouse time slots" ON public.warehouse_time_slots;
CREATE POLICY "Public read warehouse time slots"
ON public.warehouse_time_slots
FOR SELECT
TO anon, authenticated
USING (is_active);

GRANT SELECT ON public.warehouse_address_tags TO anon, authenticated;
GRANT SELECT ON public.warehouse_contact_roles TO anon, authenticated;
GRANT SELECT ON public.warehouse_weekdays TO anon, authenticated;
GRANT SELECT ON public.warehouse_time_slots TO anon, authenticated;

REVOKE ALL ON FUNCTION public.generate_warehouse_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_warehouse_form_options() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_admin_warehouses() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_warehouse_form_options() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_warehouses() TO authenticated;

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES ('/admin/warehouses', ARRAY['admin'], '/admin/dashboard', 90)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;
