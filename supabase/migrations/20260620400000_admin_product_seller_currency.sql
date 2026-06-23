-- Expose seller listing currency on admin product detail for native price display.

CREATE OR REPLACE FUNCTION public.get_admin_product_detail(p_product_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.seller_products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  RETURN jsonb_build_object(
    'product', (
      SELECT to_jsonb(p) || jsonb_build_object(
        'sellerEmail', u.email,
        'sellerBusinessName', sa.business_name,
        'sellerBaseCurrencyCode', sa.base_currency_code
      )
      FROM public.seller_products p
      JOIN auth.users u ON u.id = p.user_id
      JOIN public.seller_accounts sa ON sa.user_id = p.user_id
      WHERE p.id = p_product_id
    ),
    'specifications', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('attributeName', s.attribute_name, 'attributeValue', s.attribute_value)
          ORDER BY s.sort_order, s.id
        )
        FROM public.seller_product_specifications s
        WHERE s.product_id = p_product_id
      ),
      '[]'::jsonb
    ),
    'variants', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'variantId', v.variant_id,
            'size', v.size,
            'color', v.color,
            'mrp', v.mrp,
            'sellingPrice', v.selling_price,
            'stock', v.stock,
            'imageStoragePath', v.image_storage_path
          )
          ORDER BY v.sort_order, v.id
        )
        FROM public.seller_product_variants v
        WHERE v.product_id = p_product_id
      ),
      '[]'::jsonb
    ),
    'media', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'mediaType', m.media_type,
            'storagePath', m.storage_path,
            'fileName', m.file_name,
            'mimeType', m.mime_type,
            'slotIndex', m.slot_index
          )
          ORDER BY m.sort_order, m.id
        )
        FROM public.seller_product_media m
        WHERE m.product_id = p_product_id
      ),
      '[]'::jsonb
    )
  );
END;
$$;
