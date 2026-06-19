-- Product category taxonomy: category → sub category → product type → 8-digit HSN
-- Admin-only writes; public read for active rows (seller forms + storefront)

CREATE TABLE IF NOT EXISTS public.product_category_taxonomy (
  id BIGSERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  sub_category_name TEXT NOT NULL,
  product_type_name TEXT NOT NULL,
  hsn_code CHAR(8) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_category_taxonomy_hsn_8_digits CHECK (hsn_code ~ '^\d{8}$'),
  CONSTRAINT product_category_taxonomy_names_not_empty CHECK (
    BTRIM(category_name) <> ''
    AND BTRIM(sub_category_name) <> ''
    AND BTRIM(product_type_name) <> ''
  ),
  CONSTRAINT product_category_taxonomy_unique_path UNIQUE (
    category_name,
    sub_category_name,
    product_type_name
  )
);

CREATE INDEX IF NOT EXISTS product_category_taxonomy_category_idx
  ON public.product_category_taxonomy (category_name);

CREATE INDEX IF NOT EXISTS product_category_taxonomy_active_idx
  ON public.product_category_taxonomy (is_active)
  WHERE is_active = true;

DROP TRIGGER IF EXISTS product_category_taxonomy_set_updated_at ON public.product_category_taxonomy;
CREATE TRIGGER product_category_taxonomy_set_updated_at
BEFORE UPDATE ON public.product_category_taxonomy
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_product_category_taxonomy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.category_name := BTRIM(NEW.category_name);
  NEW.sub_category_name := BTRIM(NEW.sub_category_name);
  NEW.product_type_name := BTRIM(NEW.product_type_name);
  NEW.hsn_code := BTRIM(NEW.hsn_code);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_category_taxonomy_normalize ON public.product_category_taxonomy;
CREATE TRIGGER product_category_taxonomy_normalize
BEFORE INSERT OR UPDATE ON public.product_category_taxonomy
FOR EACH ROW
EXECUTE FUNCTION public.normalize_product_category_taxonomy();

ALTER TABLE public.product_category_taxonomy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read active product category taxonomy" ON public.product_category_taxonomy;
CREATE POLICY "Read active product category taxonomy"
ON public.product_category_taxonomy
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR (
    auth.uid() IS NOT NULL
    AND public.is_admin_account()
  )
);

DROP POLICY IF EXISTS "Admins insert product category taxonomy" ON public.product_category_taxonomy;
CREATE POLICY "Admins insert product category taxonomy"
ON public.product_category_taxonomy
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_account());

DROP POLICY IF EXISTS "Admins update product category taxonomy" ON public.product_category_taxonomy;
CREATE POLICY "Admins update product category taxonomy"
ON public.product_category_taxonomy
FOR UPDATE
TO authenticated
USING (public.is_admin_account())
WITH CHECK (public.is_admin_account());

DROP POLICY IF EXISTS "Admins delete product category taxonomy" ON public.product_category_taxonomy;
CREATE POLICY "Admins delete product category taxonomy"
ON public.product_category_taxonomy
FOR DELETE
TO authenticated
USING (public.is_admin_account());

GRANT SELECT ON public.product_category_taxonomy TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_category_taxonomy TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.product_category_taxonomy_id_seq TO authenticated;

-- Distinct top-level categories for storefront navigation
CREATE OR REPLACE VIEW public.storefront_categories AS
SELECT DISTINCT category_name
FROM public.product_category_taxonomy
WHERE is_active = true
ORDER BY category_name;

GRANT SELECT ON public.storefront_categories TO anon, authenticated;
