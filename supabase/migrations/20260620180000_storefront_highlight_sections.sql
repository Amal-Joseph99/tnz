-- Admin-curated Featured Products and Trending Now homepage sections (max 100 each)

CREATE TABLE IF NOT EXISTS public.storefront_highlight_products (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('featured', 'trending')),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT storefront_highlight_products_unique_entry UNIQUE (product_id, section_type)
);

CREATE INDEX IF NOT EXISTS storefront_highlight_products_section_idx
  ON public.storefront_highlight_products (section_type, sort_order);

CREATE OR REPLACE FUNCTION public.guard_storefront_highlight_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  active_count INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_products p
    WHERE p.id = NEW.product_id
      AND p.approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Only approved marketplace listings can be added to homepage sections.';
  END IF;

  IF NEW.is_active THEN
    SELECT COUNT(*) INTO active_count
    FROM public.storefront_highlight_products h
    WHERE h.section_type = NEW.section_type
      AND h.is_active = true
      AND (TG_OP = 'INSERT' OR h.id IS DISTINCT FROM NEW.id);

    IF active_count >= 100 THEN
      RAISE EXCEPTION 'Section limit reached. Maximum 100 products per section.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS storefront_highlight_products_guard ON public.storefront_highlight_products;
CREATE TRIGGER storefront_highlight_products_guard
BEFORE INSERT OR UPDATE ON public.storefront_highlight_products
FOR EACH ROW
EXECUTE FUNCTION public.guard_storefront_highlight_write();

DROP TRIGGER IF EXISTS storefront_highlight_products_set_updated_at ON public.storefront_highlight_products;
CREATE TRIGGER storefront_highlight_products_set_updated_at
BEFORE UPDATE ON public.storefront_highlight_products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.storefront_highlight_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active homepage highlights" ON public.storefront_highlight_products;
CREATE POLICY "Public read active homepage highlights"
ON public.storefront_highlight_products
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.seller_products p
    WHERE p.id = product_id
      AND p.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Admins manage homepage highlights" ON public.storefront_highlight_products;
CREATE POLICY "Admins manage homepage highlights"
ON public.storefront_highlight_products
FOR ALL
TO authenticated
USING (public.is_admin_account())
WITH CHECK (public.is_admin_account());

GRANT SELECT ON public.storefront_highlight_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.storefront_highlight_products TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.storefront_highlight_products_id_seq TO authenticated;

-- Admin helpers
CREATE OR REPLACE FUNCTION public.list_sellers_with_approved_products()
RETURNS TABLE (
  user_id UUID,
  business_name TEXT,
  country_name TEXT,
  product_count BIGINT
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
    sa.user_id,
    sa.business_name,
    sa.country_name,
    COUNT(p.id) AS product_count
  FROM public.seller_accounts sa
  JOIN public.seller_products p ON p.user_id = sa.user_id
  WHERE p.approval_status = 'approved'
  GROUP BY sa.user_id, sa.business_name, sa.country_name
  ORDER BY sa.business_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_approved_products_by_seller(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  sku TEXT,
  product_name TEXT,
  brand_name TEXT,
  category_name TEXT,
  sub_category_name TEXT,
  product_type_name TEXT
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
    p.id,
    p.sku,
    p.product_name,
    p.brand_name,
    p.category_name,
    p.sub_category_name,
    p.product_type_name
  FROM public.seller_products p
  WHERE p.user_id = p_user_id
    AND p.approval_status = 'approved'
  ORDER BY p.updated_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_sellers_with_approved_products() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_approved_products_by_seller(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_sellers_with_approved_products() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_approved_products_by_seller(UUID) TO authenticated;
