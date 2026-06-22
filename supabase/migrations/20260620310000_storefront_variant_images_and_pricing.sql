-- Allow public read of approved variant images in seller-products bucket

DROP POLICY IF EXISTS "Public read approved product media files" ON storage.objects;
CREATE POLICY "Public read approved product media files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'seller-products'
  AND (
    EXISTS (
      SELECT 1
      FROM public.seller_product_media m
      JOIN public.seller_products p ON p.id = m.product_id
      WHERE m.storage_path = name
        AND p.approval_status = 'approved'
    )
    OR EXISTS (
      SELECT 1
      FROM public.seller_product_variants v
      JOIN public.seller_products p ON p.id = v.product_id
      WHERE v.image_storage_path = name
        AND p.approval_status = 'approved'
    )
  )
);
