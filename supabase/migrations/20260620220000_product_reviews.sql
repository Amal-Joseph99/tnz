-- Product reviews with images, purchase verification labels, and buyer-only authoring

CREATE TABLE IF NOT EXISTS public.app_review_type_labels (
  review_type TEXT PRIMARY KEY CHECK (review_type IN ('general', 'purchased')),
  display_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO public.app_review_type_labels (review_type, display_label, sort_order)
VALUES
  ('general', 'General', 1),
  ('purchased', 'Verified Purchase', 2)
ON CONFLICT (review_type) DO UPDATE
SET display_label = EXCLUDED.display_label,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.buyer_product_purchases (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS buyer_product_purchases_product_idx
ON public.buyer_product_purchases (product_id);

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reviewer_display_name TEXT NOT NULL,
  star_rating SMALLINT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('general', 'purchased')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_reviews_text_not_empty CHECK (btrim(review_text) <> ''),
  CONSTRAINT product_reviews_name_not_empty CHECK (btrim(reviewer_display_name) <> ''),
  CONSTRAINT product_reviews_one_per_user_product UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_created_idx
ON public.product_reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS product_reviews_user_idx
ON public.product_reviews (user_id);

CREATE TABLE IF NOT EXISTS public.product_review_images (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES public.product_reviews (id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_review_images_path_not_empty CHECK (btrim(storage_path) <> '')
);

CREATE INDEX IF NOT EXISTS product_review_images_review_idx
ON public.product_review_images (review_id, sort_order);

ALTER TABLE public.app_review_type_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_product_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read review type labels" ON public.app_review_type_labels;
CREATE POLICY "Public read review type labels"
ON public.app_review_type_labels
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Buyers read own purchases" ON public.buyer_product_purchases;
CREATE POLICY "Buyers read own purchases"
ON public.buyer_product_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read approved product reviews" ON public.product_reviews;
CREATE POLICY "Public read approved product reviews"
ON public.product_reviews
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.seller_products sp
    WHERE sp.id = product_id
      AND sp.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Buyers insert own product reviews" ON public.product_reviews;
CREATE POLICY "Buyers insert own product reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_buyer_account()
  AND EXISTS (
    SELECT 1
    FROM public.seller_products sp
    WHERE sp.id = product_id
      AND sp.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Buyers update own product reviews" ON public.product_reviews;
CREATE POLICY "Buyers update own product reviews"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_buyer_account())
WITH CHECK (auth.uid() = user_id AND public.is_buyer_account());

DROP POLICY IF EXISTS "Buyers delete own product reviews" ON public.product_reviews;
CREATE POLICY "Buyers delete own product reviews"
ON public.product_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_buyer_account());

DROP POLICY IF EXISTS "Public read product review images" ON public.product_review_images;
CREATE POLICY "Public read product review images"
ON public.product_review_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.product_reviews pr
    JOIN public.seller_products sp ON sp.id = pr.product_id
    WHERE pr.id = review_id
      AND sp.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Buyers insert own review images" ON public.product_review_images;
CREATE POLICY "Buyers insert own review images"
ON public.product_review_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.product_reviews pr
    WHERE pr.id = review_id
      AND pr.user_id = auth.uid()
      AND public.is_buyer_account()
  )
);

DROP POLICY IF EXISTS "Buyers delete own review images" ON public.product_review_images;
CREATE POLICY "Buyers delete own review images"
ON public.product_review_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.product_reviews pr
    WHERE pr.id = review_id
      AND pr.user_id = auth.uid()
      AND public.is_buyer_account()
  )
);

GRANT SELECT ON public.app_review_type_labels TO anon, authenticated;
GRANT SELECT ON public.buyer_product_purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, DELETE ON public.product_review_images TO authenticated;
GRANT SELECT ON public.product_review_images TO anon;

DROP TRIGGER IF EXISTS product_reviews_set_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_set_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.buyer_reviewer_display_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bp.full_name
  FROM public.buyer_profiles bp
  WHERE bp.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.resolve_product_review_type(p_product_id BIGINT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.buyer_product_purchases bpp
      WHERE bpp.user_id = auth.uid()
        AND bpp.product_id = p_product_id
    ) THEN 'purchased'
    ELSE 'general'
  END;
$$;

CREATE OR REPLACE FUNCTION public.list_product_reviews(p_product_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_products sp
    WHERE sp.id = p_product_id
      AND sp.approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Product is not available for reviews';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row ORDER BY (row->>'created_at') DESC)
      FROM (
        SELECT jsonb_build_object(
          'id', pr.id,
          'product_id', pr.product_id,
          'user_id', pr.user_id,
          'reviewer_display_name', pr.reviewer_display_name,
          'star_rating', pr.star_rating,
          'review_text', pr.review_text,
          'review_type', pr.review_type,
          'review_type_label', lbl.display_label,
          'created_at', pr.created_at,
          'updated_at', pr.updated_at,
          'is_own_review', (v_current_user IS NOT NULL AND pr.user_id = v_current_user),
          'images', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', img.id,
                  'storage_path', img.storage_path,
                  'file_name', img.file_name,
                  'mime_type', img.mime_type,
                  'sort_order', img.sort_order
                )
                ORDER BY img.sort_order, img.id
              )
              FROM public.product_review_images img
              WHERE img.review_id = pr.id
            ),
            '[]'::jsonb
          )
        ) AS row
        FROM public.product_reviews pr
        JOIN public.app_review_type_labels lbl ON lbl.review_type = pr.review_type
        WHERE pr.product_id = p_product_id
      ) reviews
    ),
    '[]'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_product_review(
  p_product_id BIGINT,
  p_star_rating SMALLINT,
  p_review_text TEXT,
  p_image_paths JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_review_type TEXT;
  v_review_id BIGINT;
  v_image JSONB;
  v_sort INT := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_buyer_account() THEN
    RAISE EXCEPTION 'Only signed-in buyers can submit reviews';
  END IF;

  IF p_star_rating < 1 OR p_star_rating > 5 THEN
    RAISE EXCEPTION 'Star rating must be between 1 and 5';
  END IF;

  IF btrim(COALESCE(p_review_text, '')) = '' THEN
    RAISE EXCEPTION 'Review text is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_products sp
    WHERE sp.id = p_product_id
      AND sp.approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Product is not available for reviews';
  END IF;

  v_name := public.buyer_reviewer_display_name();
  IF v_name IS NULL OR btrim(v_name) = '' THEN
    RAISE EXCEPTION 'Buyer profile name is required to post a review';
  END IF;

  v_review_type := public.resolve_product_review_type(p_product_id);

  INSERT INTO public.product_reviews (
    product_id,
    user_id,
    reviewer_display_name,
    star_rating,
    review_text,
    review_type
  )
  VALUES (
    p_product_id,
    auth.uid(),
    btrim(v_name),
    p_star_rating,
    btrim(p_review_text),
    v_review_type
  )
  ON CONFLICT (product_id, user_id) DO UPDATE
  SET
    reviewer_display_name = EXCLUDED.reviewer_display_name,
    star_rating = EXCLUDED.star_rating,
    review_text = EXCLUDED.review_text,
    review_type = public.resolve_product_review_type(p_product_id),
    updated_at = NOW()
  RETURNING id INTO v_review_id;

  DELETE FROM public.product_review_images
  WHERE review_id = v_review_id;

  FOR v_image IN SELECT value FROM jsonb_array_elements(COALESCE(p_image_paths, '[]'::jsonb))
  LOOP
    IF COALESCE(v_image->>'storage_path', '') = '' THEN
      CONTINUE;
    END IF;

    INSERT INTO public.product_review_images (
      review_id,
      storage_path,
      file_name,
      mime_type,
      sort_order
    )
    VALUES (
      v_review_id,
      v_image->>'storage_path',
      COALESCE(NULLIF(v_image->>'file_name', ''), 'review-image'),
      NULLIF(v_image->>'mime_type', ''),
      COALESCE((v_image->>'sort_order')::INT, v_sort)
    );

    v_sort := v_sort + 1;
  END LOOP;

  RETURN public.list_product_reviews(p_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_product_review(p_review_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id BIGINT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_buyer_account() THEN
    RAISE EXCEPTION 'Only signed-in buyers can delete reviews';
  END IF;

  SELECT product_id
  INTO v_product_id
  FROM public.product_reviews
  WHERE id = p_review_id
    AND user_id = auth.uid();

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  DELETE FROM public.product_reviews
  WHERE id = p_review_id
    AND user_id = auth.uid();

  RETURN public.list_product_reviews(v_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_review_summary(p_product_id BIGINT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'review_count', COUNT(*)::INT,
    'average_rating', COALESCE(ROUND(AVG(star_rating)::NUMERIC, 1), 0)
  )
  FROM public.product_reviews pr
  JOIN public.seller_products sp ON sp.id = pr.product_id
  WHERE pr.product_id = p_product_id
    AND sp.approval_status = 'approved';
$$;

INSERT INTO public.app_dialog_messages (action_key, title, message, confirm_label, cancel_label)
VALUES (
  'delete_review',
  'Delete review',
  'Are you sure you want to delete your review? This action cannot be undone.',
  'Delete',
  'Cancel'
)
ON CONFLICT (action_key) DO UPDATE
SET title = EXCLUDED.title,
    message = EXCLUDED.message,
    confirm_label = EXCLUDED.confirm_label,
    cancel_label = EXCLUDED.cancel_label;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-reviews',
  'product-reviews',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Buyers upload own review images" ON storage.objects;
CREATE POLICY "Buyers upload own review images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-reviews'
  AND public.is_buyer_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Buyers read own review image files" ON storage.objects;
CREATE POLICY "Buyers read own review image files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-reviews'
  AND (
    (storage.foldername(name))[1] = auth.uid()::TEXT
    OR EXISTS (
      SELECT 1
      FROM public.product_review_images img
      WHERE img.storage_path = name
    )
  )
);

DROP POLICY IF EXISTS "Public read approved review images" ON storage.objects;
CREATE POLICY "Public read approved review images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'product-reviews'
  AND EXISTS (
    SELECT 1
    FROM public.product_review_images img
    JOIN public.product_reviews pr ON pr.id = img.review_id
    JOIN public.seller_products sp ON sp.id = pr.product_id
    WHERE img.storage_path = name
      AND sp.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Buyers delete own review image files" ON storage.objects;
CREATE POLICY "Buyers delete own review image files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-reviews'
  AND public.is_buyer_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

REVOKE ALL ON FUNCTION public.buyer_reviewer_display_name() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_product_review_type(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_product_reviews(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_product_review(BIGINT, SMALLINT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_product_review(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_product_review_summary(BIGINT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.buyer_reviewer_display_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_product_review_type(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_product_reviews(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_product_review(BIGINT, SMALLINT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_review(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_review_summary(BIGINT) TO anon, authenticated;
