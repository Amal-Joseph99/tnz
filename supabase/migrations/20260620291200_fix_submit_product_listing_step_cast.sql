-- Fix submit_seller_product_listing: literal 5 is integer, not smallint.
CREATE OR REPLACE FUNCTION public.submit_seller_product_listing(
  p_product_id BIGINT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.save_seller_product_listing_draft(p_product_id, 5::SMALLINT, false, p_payload);

  UPDATE public.seller_products
  SET approval_status = 'pending', submitted_at = NOW(), listing_step = 5
  WHERE id = p_product_id AND user_id = auth.uid();
END;
$$;
