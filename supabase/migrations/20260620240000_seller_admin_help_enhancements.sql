-- Seller product load/stock, admin review details, help portal content, rejection templates

CREATE OR REPLACE FUNCTION public.get_seller_workflow_state()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_kyc public.seller_kyc_submissions%ROWTYPE;
  v_warehouse public.seller_warehouses%ROWTYPE;
  v_product public.seller_products%ROWTYPE;
  v_kyc_status TEXT := 'not_submitted';
  v_product_status TEXT := 'none';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'kycId', '',
      'kycStatus', 'not_submitted',
      'warehouseCompleted', false,
      'productApprovalStatus', 'none',
      'productName', '',
      'productId', 0
    );
  END IF;

  SELECT * INTO v_kyc FROM public.seller_kyc_submissions WHERE user_id = v_user_id;
  IF FOUND THEN
    v_kyc_status := v_kyc.status;
  END IF;

  SELECT * INTO v_warehouse FROM public.seller_warehouses WHERE user_id = v_user_id;

  SELECT * INTO v_product
  FROM public.seller_products
  WHERE user_id = v_user_id
  ORDER BY
    CASE approval_status
      WHEN 'pending' THEN 1
      WHEN 'rejected' THEN 2
      WHEN 'draft' THEN 3
      WHEN 'approved' THEN 4
      ELSE 5
    END,
    updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_product_status := v_product.approval_status;
  END IF;

  RETURN jsonb_build_object(
    'kycId', COALESCE(v_kyc.kyc_id, ''),
    'kycStatus', v_kyc_status,
    'warehouseCompleted', COALESCE(v_warehouse.is_completed, false),
    'productApprovalStatus', v_product_status,
    'productName', COALESCE(v_product.product_name, ''),
    'productId', COALESCE(v_product.id, 0),
    'rejectionReason', COALESCE(v_product.rejection_reason, '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seller_product_listing(p_product_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product public.seller_products%ROWTYPE;
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  SELECT * INTO v_product
  FROM public.seller_products
  WHERE id = p_product_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  RETURN jsonb_build_object(
    'product', to_jsonb(v_product),
    'specifications', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'attributeName', s.attribute_name,
            'attributeValue', s.attribute_value,
            'sortOrder', s.sort_order
          )
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
            'id', v.id,
            'variantId', v.variant_id,
            'size', v.size,
            'color', v.color,
            'mrp', v.mrp,
            'sellingPrice', v.selling_price,
            'stock', v.stock,
            'imageStoragePath', v.image_storage_path,
            'sortOrder', v.sort_order
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
            'slotIndex', m.slot_index,
            'sortOrder', m.sort_order
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

CREATE OR REPLACE FUNCTION public.update_seller_product_stock(
  p_product_id BIGINT,
  p_variants JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_variant JSONB;
  v_variant_db_id BIGINT;
  v_stock INT;
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_products p
    WHERE p.id = p_product_id
      AND p.user_id = v_user_id
      AND p.approval_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Stock can only be updated on approved listings.';
  END IF;

  FOR v_variant IN SELECT value FROM jsonb_array_elements(COALESCE(p_variants, '[]'::jsonb))
  LOOP
    v_variant_db_id := NULLIF(v_variant->>'id', '')::BIGINT;
    v_stock := COALESCE((v_variant->>'stock')::INT, 0);

    IF v_variant_db_id IS NULL THEN
      RAISE EXCEPTION 'Variant id is required for stock updates.';
    END IF;

    UPDATE public.seller_product_variants v
    SET stock = GREATEST(v_stock, 0)
    FROM public.seller_products p
    WHERE v.id = v_variant_db_id
      AND v.product_id = p_product_id
      AND p.user_id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant not found for this product.';
    END IF;
  END LOOP;

  RETURN public.get_seller_product_listing(p_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_kyc_detail(p_user_id UUID)
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

  RETURN (
    SELECT jsonb_build_object(
      'submission', row_to_json(k)::jsonb,
      'sellerEmail', u.email,
      'signupBusinessName', sa.business_name,
      'countryName', sa.country_name,
      'phone', sa.phone,
      'documents', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'documentType', d.document_type,
              'storagePath', d.storage_path,
              'fileName', d.file_name,
              'mimeType', d.mime_type
            )
            ORDER BY d.document_type
          )
          FROM public.seller_kyc_documents d
          WHERE d.user_id = p_user_id
        ),
        '[]'::jsonb
      )
    )
    FROM public.seller_kyc_submissions k
    JOIN auth.users u ON u.id = k.user_id
    JOIN public.seller_accounts sa ON sa.user_id = k.user_id
    WHERE k.user_id = p_user_id
  );
END;
$$;

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
        'sellerBusinessName', sa.business_name
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

CREATE TABLE IF NOT EXISTS public.help_portals (
  portal_key TEXT PRIMARY KEY CHECK (portal_key IN ('buyer', 'seller', 'admin')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.help_topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  portal_key TEXT NOT NULL REFERENCES public.help_portals (portal_key) ON DELETE CASCADE,
  topic_key TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  link_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT help_topics_portal_topic_unique UNIQUE (portal_key, topic_key)
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  portal_key TEXT NOT NULL REFERENCES public.help_portals (portal_key) ON DELETE CASCADE,
  topic_key TEXT,
  article_key TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT help_articles_portal_article_key_unique UNIQUE (portal_key, article_key)
);

CREATE TABLE IF NOT EXISTS public.support_request_topics (
  topic_key TEXT PRIMARY KEY,
  portal_key TEXT NOT NULL REFERENCES public.help_portals (portal_key) ON DELETE CASCADE,
  display_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.support_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  portal_key TEXT NOT NULL REFERENCES public.help_portals (portal_key),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  topic_key TEXT NOT NULL REFERENCES public.support_request_topics (topic_key),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_requests_message_not_empty CHECK (btrim(message) <> '')
);

CREATE TABLE IF NOT EXISTS public.app_rejection_templates (
  rejection_type TEXT NOT NULL CHECK (rejection_type IN ('kyc', 'product')),
  template_key TEXT NOT NULL,
  message TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (rejection_type, template_key)
);

INSERT INTO public.help_portals (portal_key, title, subtitle)
VALUES
  ('buyer', 'Help Center', 'Find answers about shopping, payments, orders, returns, and account support.'),
  ('seller', 'Seller Help', 'Get support for KYC, listings, warehouse setup, orders, and payouts.'),
  ('admin', 'Admin Help', 'Platform operations, approvals, compliance, and console guidance.')
ON CONFLICT (portal_key) DO UPDATE
SET title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle;

INSERT INTO public.help_topics (portal_key, topic_key, title, summary, link_path, sort_order)
VALUES
  ('buyer', 'orders', 'Orders and delivery', 'Track shipments, cancel eligible orders, and download invoices.', '/orders', 1),
  ('buyer', 'returns', 'Returns and refunds', 'Start returns, check eligibility, and review refund timelines.', '/returns', 2),
  ('buyer', 'account', 'Account settings', 'Update login details, addresses, notifications, and security.', '/profile', 3),
  ('buyer', 'payments', 'Payments', 'Payment methods, failed charges, and checkout help.', '/checkout', 4),
  ('seller', 'kyc', 'KYC verification', 'Submit business documents and bank details for approval.', '/seller/profile', 1),
  ('seller', 'warehouse', 'Warehouse setup', 'Save dispatch address and cutoff time before listing products.', '/seller/warehouse', 2),
  ('seller', 'products', 'Product listings', 'Create drafts, upload media, submit for approval, and update stock.', '/seller/products', 3),
  ('seller', 'orders', 'Seller orders', 'Manage order fulfillment and dispatch updates.', '/seller/orders', 4),
  ('admin', 'kyc', 'KYC approvals', 'Review seller identity, documents, and bank verification.', '/admin/kyc', 1),
  ('admin', 'products', 'Product approvals', 'Review listings, media, variants, and compliance before publish.', '/admin/products', 2),
  ('admin', 'categories', 'Category management', 'Maintain taxonomy, HSN mappings, and storefront categories.', '/admin/categories', 3),
  ('admin', 'homepage', 'Homepage sections', 'Curate featured and trending storefront sections.', '/admin/homepage-sections', 4)
ON CONFLICT (portal_key, topic_key) DO UPDATE
SET title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    link_path = EXCLUDED.link_path,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.help_articles (portal_key, topic_key, title, body, sort_order, article_key)
VALUES
  ('buyer', 'orders', 'How do I track my order?', 'Open My orders from your account menu to view shipment status and delivery updates.', 1, 'how_track_order'),
  ('buyer', 'returns', 'How do returns work?', 'Visit Returns to check eligibility, start a return request, and follow refund timelines.', 1, 'how_returns_work'),
  ('seller', 'products', 'How do drafts work?', 'Save product information as a draft anytime. Submit for admin approval only when all five product images are uploaded.', 1, 'how_drafts_work'),
  ('seller', 'products', 'How do I update stock?', 'After admin approval, open the product in your catalogue and use Update stock without resubmitting the full listing.', 2, 'how_update_stock'),
  ('admin', 'kyc', 'What should I verify in KYC?', 'Review uploaded photo, address proof, tax ID proof, business address, and bank account details before approving.', 1, 'what_verify_kyc'),
  ('admin', 'products', 'What should I verify in listings?', 'Check SKU, HSN, category mapping, five product images, variant pricing, and stock before approval.', 1, 'what_verify_listings')
ON CONFLICT (portal_key, article_key) DO UPDATE
SET topic_key = EXCLUDED.topic_key,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.support_request_topics (topic_key, portal_key, display_label, sort_order)
VALUES
  ('buyer_order', 'buyer', 'Order issue', 1),
  ('buyer_payment', 'buyer', 'Payment issue', 2),
  ('buyer_return', 'buyer', 'Return or refund', 3),
  ('buyer_account', 'buyer', 'Account help', 4),
  ('seller_kyc', 'seller', 'KYC verification', 1),
  ('seller_listing', 'seller', 'Product listing', 2),
  ('seller_payout', 'seller', 'Payout issue', 3),
  ('seller_order', 'seller', 'Order fulfillment', 4),
  ('admin_approval', 'admin', 'Approvals workflow', 1),
  ('admin_compliance', 'admin', 'Compliance issue', 2),
  ('admin_platform', 'admin', 'Platform configuration', 3)
ON CONFLICT (topic_key) DO UPDATE
SET portal_key = EXCLUDED.portal_key,
    display_label = EXCLUDED.display_label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.app_rejection_templates (rejection_type, template_key, message, sort_order)
VALUES
  ('kyc', 'documents_invalid', 'Uploaded documents did not pass verification. Please resubmit clear copies of all required documents.', 1),
  ('kyc', 'bank_mismatch', 'Bank account details did not match the submitted business information.', 2),
  ('kyc', 'business_details_invalid', 'Business details were incomplete or could not be verified.', 3),
  ('product', 'images_missing', 'Listing did not meet the required five product images.', 1),
  ('product', 'category_mismatch', 'Category, sub category, or HSN mapping did not match the product details.', 2),
  ('product', 'compliance_issue', 'Listing did not meet marketplace compliance requirements.', 3)
ON CONFLICT (rejection_type, template_key) DO UPDATE
SET message = EXCLUDED.message,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS public.product_listing_field_options (
  field_key TEXT PRIMARY KEY,
  option_values JSONB NOT NULL
);

INSERT INTO public.product_listing_field_options (field_key, option_values)
VALUES
  ('packing_type', '["Box", "Poly mailer", "Tube", "Crate"]'::jsonb),
  ('size_preset', '["Free Size", "S", "M", "L", "XL"]'::jsonb),
  ('color_preset', '["Black", "Blue", "White", "Gold"]'::jsonb)
ON CONFLICT (field_key) DO UPDATE
SET option_values = EXCLUDED.option_values;

ALTER TABLE public.product_listing_field_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read listing field options" ON public.product_listing_field_options;
CREATE POLICY "Public read listing field options" ON public.product_listing_field_options
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.product_listing_field_options TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_product_listing_field_options()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_object_agg(field_key, option_values),
    '{}'::jsonb
  )
  FROM public.product_listing_field_options;
$$;

REVOKE ALL ON FUNCTION public.list_product_listing_field_options() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_product_listing_field_options() TO anon, authenticated;

ALTER TABLE public.help_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_request_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_rejection_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read help portals" ON public.help_portals;
CREATE POLICY "Public read help portals" ON public.help_portals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read help topics" ON public.help_topics;
CREATE POLICY "Public read help topics" ON public.help_topics FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read help articles" ON public.help_articles;
CREATE POLICY "Public read help articles" ON public.help_articles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read support topics" ON public.support_request_topics;
CREATE POLICY "Public read support topics" ON public.support_request_topics FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read rejection templates" ON public.app_rejection_templates;
CREATE POLICY "Public read rejection templates" ON public.app_rejection_templates FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users read own support requests" ON public.support_requests;
CREATE POLICY "Users read own support requests" ON public.support_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own support requests" ON public.support_requests;
CREATE POLICY "Users insert own support requests" ON public.support_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all support requests" ON public.support_requests;
CREATE POLICY "Admins read all support requests" ON public.support_requests FOR SELECT TO authenticated USING (public.is_admin_account());

GRANT SELECT ON public.help_portals TO anon, authenticated;
GRANT SELECT ON public.help_topics TO anon, authenticated;
GRANT SELECT ON public.help_articles TO anon, authenticated;
GRANT SELECT ON public.support_request_topics TO anon, authenticated;
GRANT SELECT ON public.app_rejection_templates TO anon, authenticated;
GRANT SELECT, INSERT ON public.support_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.list_help_portal_content(p_portal_key TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'portal', (SELECT to_jsonb(hp) FROM public.help_portals hp WHERE hp.portal_key = p_portal_key),
    'topics', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(t) ORDER BY t.sort_order, t.id)
        FROM public.help_topics t
        WHERE t.portal_key = p_portal_key
      ),
      '[]'::jsonb
    ),
    'articles', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(a) ORDER BY a.sort_order, a.id)
        FROM public.help_articles a
        WHERE a.portal_key = p_portal_key
      ),
      '[]'::jsonb
    ),
    'supportTopics', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(s) ORDER BY s.sort_order)
        FROM public.support_request_topics s
        WHERE s.portal_key = p_portal_key
      ),
      '[]'::jsonb
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.search_help_articles(p_portal_key TEXT, p_query TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(a) ORDER BY a.sort_order, a.id),
    '[]'::jsonb
  )
  FROM public.help_articles a
  WHERE a.portal_key = p_portal_key
    AND (
      btrim(COALESCE(p_query, '')) = ''
      OR a.title ILIKE '%' || btrim(p_query) || '%'
      OR a.body ILIKE '%' || btrim(p_query) || '%'
    );
$$;

CREATE OR REPLACE FUNCTION public.submit_support_request(
  p_portal_key TEXT,
  p_topic_key TEXT,
  p_message TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Signed-in access required.';
  END IF;

  IF btrim(COALESCE(p_message, '')) = '' THEN
    RAISE EXCEPTION 'Message is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.support_request_topics t
    WHERE t.topic_key = p_topic_key
      AND t.portal_key = p_portal_key
  ) THEN
    RAISE EXCEPTION 'Invalid support topic.';
  END IF;

  IF p_portal_key = 'buyer' AND NOT public.is_buyer_account() THEN
    RAISE EXCEPTION 'Buyer access required.';
  END IF;

  IF p_portal_key = 'seller' AND NOT public.is_seller_account() THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF p_portal_key = 'admin' AND NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  INSERT INTO public.support_requests (portal_key, user_id, topic_key, message)
  VALUES (p_portal_key, auth.uid(), p_topic_key, btrim(p_message))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_rejection_templates(p_rejection_type TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'templateKey', template_key,
        'message', message,
        'sortOrder', sort_order
      )
      ORDER BY sort_order
    ),
    '[]'::jsonb
  )
  FROM public.app_rejection_templates
  WHERE rejection_type = p_rejection_type;
$$;

REVOKE ALL ON FUNCTION public.get_seller_product_listing(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_seller_product_stock(BIGINT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_kyc_detail(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_product_detail(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_help_portal_content(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_help_articles(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_support_request(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_rejection_templates(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_seller_workflow_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_product_listing(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_seller_product_stock(BIGINT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_kyc_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_product_detail(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_help_portal_content(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_help_articles(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_support_request(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_rejection_templates(TEXT) TO authenticated;
