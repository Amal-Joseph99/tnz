-- Storefront: public product image bucket + seller listing currency for anon buyers

UPDATE storage.buckets
SET public = true
WHERE id = 'seller-products';

CREATE OR REPLACE FUNCTION public.list_seller_listing_currencies(p_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  base_currency_code CHAR(3)
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sa.user_id, sa.base_currency_code
  FROM public.seller_accounts sa
  WHERE cardinality(p_user_ids) = 0 OR sa.user_id = ANY(p_user_ids);
$$;

REVOKE ALL ON FUNCTION public.list_seller_listing_currencies(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_seller_listing_currencies(UUID[]) TO anon, authenticated;
