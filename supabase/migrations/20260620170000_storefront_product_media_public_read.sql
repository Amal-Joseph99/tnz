-- Allow public read of media files for approved marketplace listings

DROP POLICY IF EXISTS "Public read approved product media files" ON storage.objects;
CREATE POLICY "Public read approved product media files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'seller-products'
  AND EXISTS (
    SELECT 1
    FROM public.seller_product_media m
    JOIN public.seller_products p ON p.id = m.product_id
    WHERE m.storage_path = name
      AND p.approval_status = 'approved'
  )
);
