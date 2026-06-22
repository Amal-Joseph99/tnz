-- Remove E2E test product listings from the admin queue and exclude them from future queries.

DELETE FROM public.seller_products
WHERE product_name LIKE 'E2E Test%'
   OR sku LIKE 'SKUAT%';

CREATE OR REPLACE FUNCTION public.list_seller_product_submissions(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id BIGINT,
  user_id UUID,
  sku TEXT,
  product_name TEXT,
  category_name TEXT,
  sub_category_name TEXT,
  product_type_name TEXT,
  hsn_code TEXT,
  brand_name TEXT,
  approval_status TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  seller_email TEXT,
  seller_business_name TEXT
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
    p.user_id,
    p.sku::TEXT,
    p.product_name::TEXT,
    p.category_name::TEXT,
    p.sub_category_name::TEXT,
    p.product_type_name::TEXT,
    p.hsn_code::TEXT,
    p.brand_name::TEXT,
    p.approval_status::TEXT,
    p.submitted_at,
    p.reviewed_at,
    p.rejection_reason::TEXT,
    u.email::TEXT,
    COALESCE(sa.business_name, p.brand_name, 'Seller')::TEXT
  FROM public.seller_products p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.seller_accounts sa ON sa.user_id = p.user_id
  WHERE (p_status IS NULL OR p.approval_status = p_status)
    AND p.product_name NOT LIKE 'E2E Test%'
    AND p.sku NOT LIKE 'SKUAT%'
  ORDER BY p.submitted_at DESC NULLS LAST, p.updated_at DESC;
END;
$$;
