-- Seller KYC, warehouse, product listings, media storage, and admin review workflows

-- ---------------------------------------------------------------------------
-- KYC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_kyc_submissions (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  kyc_id CHAR(12) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  business_type TEXT NOT NULL
    CHECK (business_type IN ('Individual', 'Proprietorship', 'Partnership', 'Private Limited', 'LLP')),
  business_name TEXT NOT NULL,
  business_address TEXT NOT NULL,
  tax_id TEXT,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_swift TEXT NOT NULL,
  terms_accepted_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users (id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_kyc_submissions_names_not_empty CHECK (
    BTRIM(business_name) <> ''
    AND BTRIM(business_address) <> ''
    AND BTRIM(account_holder_name) <> ''
    AND BTRIM(bank_name) <> ''
    AND BTRIM(account_number) <> ''
    AND BTRIM(ifsc_swift) <> ''
  )
);

CREATE INDEX IF NOT EXISTS seller_kyc_submissions_status_idx
  ON public.seller_kyc_submissions (status);

CREATE TABLE IF NOT EXISTS public.seller_kyc_documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('photo', 'address_proof', 'tax_id_proof')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_kyc_documents_unique_type UNIQUE (user_id, document_type)
);

CREATE INDEX IF NOT EXISTS seller_kyc_documents_user_idx
  ON public.seller_kyc_documents (user_id);

-- ---------------------------------------------------------------------------
-- Warehouse
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_warehouses (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  warehouse_name TEXT NOT NULL,
  address_line TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  dispatch_cutoff_time TIME NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_warehouses_fields_not_empty CHECK (
    BTRIM(warehouse_name) <> ''
    AND BTRIM(address_line) <> ''
    AND BTRIM(postal_code) <> ''
  )
);

-- ---------------------------------------------------------------------------
-- Product listings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_products (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  sub_category_name TEXT NOT NULL,
  product_type_name TEXT NOT NULL,
  hsn_code CHAR(8) NOT NULL,
  brand_name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  packing_type TEXT NOT NULL
    CHECK (packing_type IN ('Box', 'Poly mailer', 'Tube', 'Crate')),
  weight_kg NUMERIC(10, 3) NOT NULL CHECK (weight_kg > 0),
  package_length_cm NUMERIC(10, 2) NOT NULL CHECK (package_length_cm > 0),
  package_width_cm NUMERIC(10, 2) NOT NULL CHECK (package_width_cm > 0),
  package_height_cm NUMERIC(10, 2) NOT NULL CHECK (package_height_cm > 0),
  manufacturer_name TEXT NOT NULL,
  manufacturer_country TEXT NOT NULL,
  origin_country TEXT NOT NULL,
  usage_note TEXT,
  ingredients TEXT,
  approval_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users (id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_products_hsn_8_digits CHECK (hsn_code ~ '^\d{8}$'),
  CONSTRAINT seller_products_names_not_empty CHECK (
    BTRIM(product_name) <> ''
    AND BTRIM(brand_name) <> ''
    AND BTRIM(sku) <> ''
  )
);

CREATE INDEX IF NOT EXISTS seller_products_user_idx ON public.seller_products (user_id);
CREATE INDEX IF NOT EXISTS seller_products_approval_status_idx ON public.seller_products (approval_status);

CREATE TABLE IF NOT EXISTS public.seller_product_specifications (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT seller_product_specifications_not_empty CHECK (
    BTRIM(attribute_name) <> ''
    AND BTRIM(attribute_value) <> ''
  )
);

CREATE INDEX IF NOT EXISTS seller_product_specifications_product_idx
  ON public.seller_product_specifications (product_id);

CREATE TABLE IF NOT EXISTS public.seller_product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
  selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT seller_product_variants_unique_variant UNIQUE (product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS seller_product_variants_product_idx
  ON public.seller_product_variants (product_id);

CREATE TABLE IF NOT EXISTS public.seller_product_media (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.seller_products (id) ON DELETE CASCADE,
  media_type TEXT NOT NULL
    CHECK (media_type IN ('product_image', 'product_video', 'description_image')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  slot_index INT CHECK (slot_index IS NULL OR (slot_index >= 1 AND slot_index <= 5)),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_product_media_product_idx
  ON public.seller_product_media (product_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_seller_kyc_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := (floor(100000000000 + random() * 900000000000))::BIGINT::TEXT;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.seller_kyc_submissions WHERE kyc_id = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_seller_kyc_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_admin_account() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_seller_account() OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this KYC submission.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.kyc_id := COALESCE(NULLIF(BTRIM(NEW.kyc_id), ''), public.generate_seller_kyc_id());
    NEW.status := 'pending';
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.submitted_at := NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' THEN
      RAISE EXCEPTION 'KYC is pending review and cannot be edited.';
    END IF;
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Approved KYC cannot be edited.';
    END IF;
    NEW.status := 'pending';
    NEW.kyc_id := OLD.kyc_id;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.submitted_at := NOW();
  END IF;

  NEW.business_name := BTRIM(NEW.business_name);
  NEW.business_address := BTRIM(NEW.business_address);
  NEW.business_type := BTRIM(NEW.business_type);
  NEW.account_holder_name := BTRIM(NEW.account_holder_name);
  NEW.bank_name := BTRIM(NEW.bank_name);
  NEW.account_number := BTRIM(NEW.account_number);
  NEW.ifsc_swift := BTRIM(NEW.ifsc_swift);
  NEW.tax_id := NULLIF(BTRIM(COALESCE(NEW.tax_id, '')), '');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_seller_warehouse_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.is_seller_account() OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this warehouse.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_kyc_submissions k
    WHERE k.user_id = NEW.user_id
      AND k.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'KYC must be approved before warehouse setup.';
  END IF;

  NEW.warehouse_name := BTRIM(NEW.warehouse_name);
  NEW.address_line := BTRIM(NEW.address_line);
  NEW.postal_code := BTRIM(NEW.postal_code);
  NEW.is_completed := true;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_seller_product_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.is_admin_account() THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_seller_account() OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to modify this product listing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_warehouses w
    WHERE w.user_id = NEW.user_id
      AND w.is_completed = true
  ) THEN
    RAISE EXCEPTION 'Warehouse setup must be completed before product listing.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'pending' THEN
    RAISE EXCEPTION 'Product is pending admin review and cannot be edited.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.approval_status = 'approved' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NEW.approval_status NOT IN ('approved') THEN
      RAISE EXCEPTION 'Approved listings cannot be downgraded by sellers.';
    END IF;
  END IF;

  IF NOT public.is_admin_account() AND NEW.approval_status IN ('approved', 'rejected') THEN
    IF TG_OP = 'INSERT' OR NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      IF NEW.approval_status <> 'pending' OR (TG_OP = 'UPDATE' AND OLD.approval_status NOT IN ('draft', 'rejected')) THEN
        IF NEW.approval_status IN ('approved', 'rejected') THEN
          RAISE EXCEPTION 'Only admins can approve or reject product listings.';
        END IF;
      END IF;
    END IF;
  END IF;

  IF NEW.approval_status = 'pending' AND (TG_OP = 'INSERT' OR OLD.approval_status IS DISTINCT FROM 'pending') THEN
    NEW.submitted_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_kyc_submissions_guard ON public.seller_kyc_submissions;
CREATE TRIGGER seller_kyc_submissions_guard
BEFORE INSERT OR UPDATE ON public.seller_kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.guard_seller_kyc_write();

DROP TRIGGER IF EXISTS seller_kyc_submissions_set_updated_at ON public.seller_kyc_submissions;
CREATE TRIGGER seller_kyc_submissions_set_updated_at
BEFORE UPDATE ON public.seller_kyc_submissions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS seller_warehouses_guard ON public.seller_warehouses;
CREATE TRIGGER seller_warehouses_guard
BEFORE INSERT OR UPDATE ON public.seller_warehouses
FOR EACH ROW
EXECUTE FUNCTION public.guard_seller_warehouse_write();

DROP TRIGGER IF EXISTS seller_warehouses_set_updated_at ON public.seller_warehouses;
CREATE TRIGGER seller_warehouses_set_updated_at
BEFORE UPDATE ON public.seller_warehouses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS seller_products_guard ON public.seller_products;
CREATE TRIGGER seller_products_guard
BEFORE INSERT OR UPDATE ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.guard_seller_product_write();

DROP TRIGGER IF EXISTS seller_products_set_updated_at ON public.seller_products;
CREATE TRIGGER seller_products_set_updated_at
BEFORE UPDATE ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: seller workflow snapshot (replaces localStorage mock)
-- ---------------------------------------------------------------------------
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
      'productName', ''
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
      WHEN 'approved' THEN 3
      WHEN 'draft' THEN 4
      ELSE 5
    END,
    updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_product.approval_status = 'draft' THEN
      v_product_status := 'none';
    ELSE
      v_product_status := v_product.approval_status;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'kycId', COALESCE(v_kyc.kyc_id, ''),
    'kycStatus', v_kyc_status,
    'warehouseCompleted', COALESCE(v_warehouse.is_completed, false),
    'productApprovalStatus', v_product_status,
    'productName', COALESCE(v_product.product_name, ''),
    'productId', COALESCE(v_product.id, 0)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin KYC queue + review
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_seller_kyc_submissions(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  kyc_id TEXT,
  status TEXT,
  business_type TEXT,
  business_name TEXT,
  business_address TEXT,
  tax_id TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_swift TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  seller_email TEXT,
  signup_business_name TEXT,
  country_name TEXT,
  phone TEXT
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
    k.user_id,
    k.kyc_id,
    k.status,
    k.business_type,
    k.business_name,
    k.business_address,
    k.tax_id,
    k.account_holder_name,
    k.bank_name,
    k.account_number,
    k.ifsc_swift,
    k.submitted_at,
    k.reviewed_at,
    k.rejection_reason,
    u.email::TEXT,
    sa.business_name,
    sa.country_name,
    sa.phone
  FROM public.seller_kyc_submissions k
  JOIN auth.users u ON u.id = k.user_id
  JOIN public.seller_accounts sa ON sa.user_id = k.user_id
  WHERE p_status IS NULL OR k.status = p_status
  ORDER BY k.submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_seller_kyc(
  p_user_id UUID,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  UPDATE public.seller_kyc_submissions
  SET
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = CASE WHEN p_approved THEN NULL ELSE NULLIF(BTRIM(p_rejection_reason), '') END
  WHERE user_id = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending KYC submission found for this seller.';
  END IF;

  IF NOT p_approved THEN
    DELETE FROM public.seller_warehouses WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin product queue + review
-- ---------------------------------------------------------------------------
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
    p.sku,
    p.product_name,
    p.category_name,
    p.sub_category_name,
    p.product_type_name,
    p.hsn_code,
    p.brand_name,
    p.approval_status,
    p.submitted_at,
    p.reviewed_at,
    p.rejection_reason,
    u.email::TEXT,
    sa.business_name
  FROM public.seller_products p
  JOIN auth.users u ON u.id = p.user_id
  JOIN public.seller_accounts sa ON sa.user_id = p.user_id
  WHERE p_status IS NULL OR p.approval_status = p_status
  ORDER BY p.submitted_at DESC NULLS LAST, p.updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_seller_product(
  p_product_id BIGINT,
  p_approved BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  UPDATE public.seller_products
  SET
    approval_status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    rejection_reason = CASE WHEN p_approved THEN NULL ELSE NULLIF(BTRIM(p_rejection_reason), '') END
  WHERE id = p_product_id
    AND approval_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending product listing found.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_pending_admin_approvals()
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

  RETURN jsonb_build_object(
    'pendingKyc', (SELECT COUNT(*) FROM public.seller_kyc_submissions WHERE status = 'pending'),
    'pendingProducts', (SELECT COUNT(*) FROM public.seller_products WHERE approval_status = 'pending')
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: atomic product listing save (matches seller UI sections)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_seller_product_listing(p_payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product_id BIGINT;
  v_submit BOOLEAN := COALESCE((p_payload->>'submitForApproval')::BOOLEAN, false);
  v_variant JSONB;
  v_spec JSONB;
  v_media JSONB;
  v_variant_row_id BIGINT;
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.seller_warehouses WHERE user_id = v_user_id AND is_completed = true
  ) THEN
    RAISE EXCEPTION 'Warehouse setup must be completed first.';
  END IF;

  v_product_id := NULLIF(p_payload->>'productId', '')::BIGINT;

  IF v_product_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.seller_products
      WHERE id = v_product_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Product not found.';
    END IF;

    UPDATE public.seller_products
    SET
      sku = p_payload->>'sku',
      product_name = p_payload->>'productName',
      category_name = p_payload->>'categoryName',
      sub_category_name = p_payload->>'subCategoryName',
      product_type_name = p_payload->>'productTypeName',
      hsn_code = p_payload->>'hsnCode',
      brand_name = p_payload->>'brandName',
      short_description = NULLIF(p_payload->>'shortDescription', ''),
      full_description = NULLIF(p_payload->>'fullDescription', ''),
      packing_type = p_payload->>'packingType',
      weight_kg = (p_payload->>'weightKg')::NUMERIC,
      package_length_cm = (p_payload->>'packageLengthCm')::NUMERIC,
      package_width_cm = (p_payload->>'packageWidthCm')::NUMERIC,
      package_height_cm = (p_payload->>'packageHeightCm')::NUMERIC,
      manufacturer_name = p_payload->>'manufacturerName',
      manufacturer_country = p_payload->>'manufacturerCountry',
      origin_country = p_payload->>'originCountry',
      usage_note = NULLIF(p_payload->>'usageNote', ''),
      ingredients = NULLIF(p_payload->>'ingredients', ''),
      approval_status = CASE WHEN v_submit THEN 'pending' ELSE 'draft' END
    WHERE id = v_product_id;
  ELSE
    INSERT INTO public.seller_products (
      user_id, sku, product_name, category_name, sub_category_name, product_type_name,
      hsn_code, brand_name, short_description, full_description, packing_type,
      weight_kg, package_length_cm, package_width_cm, package_height_cm,
      manufacturer_name, manufacturer_country, origin_country, usage_note, ingredients,
      approval_status
    ) VALUES (
      v_user_id,
      p_payload->>'sku',
      p_payload->>'productName',
      p_payload->>'categoryName',
      p_payload->>'subCategoryName',
      p_payload->>'productTypeName',
      p_payload->>'hsnCode',
      p_payload->>'brandName',
      NULLIF(p_payload->>'shortDescription', ''),
      NULLIF(p_payload->>'fullDescription', ''),
      p_payload->>'packingType',
      (p_payload->>'weightKg')::NUMERIC,
      (p_payload->>'packageLengthCm')::NUMERIC,
      (p_payload->>'packageWidthCm')::NUMERIC,
      (p_payload->>'packageHeightCm')::NUMERIC,
      p_payload->>'manufacturerName',
      p_payload->>'manufacturerCountry',
      p_payload->>'originCountry',
      NULLIF(p_payload->>'usageNote', ''),
      NULLIF(p_payload->>'ingredients', ''),
      CASE WHEN v_submit THEN 'pending' ELSE 'draft' END
    )
    RETURNING id INTO v_product_id;
  END IF;

  DELETE FROM public.seller_product_specifications WHERE product_id = v_product_id;
  DELETE FROM public.seller_product_variants WHERE product_id = v_product_id;
  DELETE FROM public.seller_product_media WHERE product_id = v_product_id;

  FOR v_spec IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'specifications', '[]'::JSONB))
  LOOP
    INSERT INTO public.seller_product_specifications (product_id, attribute_name, attribute_value, sort_order)
    VALUES (
      v_product_id,
      v_spec->>'attributeName',
      v_spec->>'attributeValue',
      COALESCE((v_spec->>'sortOrder')::INT, 0)
    );
  END LOOP;

  FOR v_variant IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'variants', '[]'::JSONB))
  LOOP
    INSERT INTO public.seller_product_variants (
      product_id, variant_id, size, color, mrp, selling_price, stock, image_storage_path, sort_order
    ) VALUES (
      v_product_id,
      v_variant->>'variantId',
      v_variant->>'size',
      v_variant->>'color',
      (v_variant->>'mrp')::NUMERIC,
      (v_variant->>'sellingPrice')::NUMERIC,
      COALESCE((v_variant->>'stock')::INT, 0),
      NULLIF(v_variant->>'imageStoragePath', ''),
      COALESCE((v_variant->>'sortOrder')::INT, 0)
    )
    RETURNING id INTO v_variant_row_id;
  END LOOP;

  FOR v_media IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'media', '[]'::JSONB))
  LOOP
    INSERT INTO public.seller_product_media (
      product_id, media_type, storage_path, file_name, mime_type, slot_index, sort_order
    ) VALUES (
      v_product_id,
      v_media->>'mediaType',
      v_media->>'storagePath',
      v_media->>'fileName',
      NULLIF(v_media->>'mimeType', ''),
      NULLIF(v_media->>'slotIndex', '')::INT,
      COALESCE((v_media->>'sortOrder')::INT, 0)
    );
  END LOOP;

  RETURN v_product_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.seller_kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_product_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read seller accounts" ON public.seller_accounts;
CREATE POLICY "Admins read seller accounts"
ON public.seller_accounts
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Sellers read own KYC" ON public.seller_kyc_submissions;
CREATE POLICY "Sellers read own KYC"
ON public.seller_kyc_submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all KYC" ON public.seller_kyc_submissions;
CREATE POLICY "Admins read all KYC"
ON public.seller_kyc_submissions
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Sellers insert own KYC" ON public.seller_kyc_submissions;
CREATE POLICY "Sellers insert own KYC"
ON public.seller_kyc_submissions
FOR INSERT
TO authenticated
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers update own rejected KYC" ON public.seller_kyc_submissions;
CREATE POLICY "Sellers update own rejected KYC"
ON public.seller_kyc_submissions
FOR UPDATE
TO authenticated
USING (public.is_seller_account() AND auth.uid() = user_id AND status = 'rejected')
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update KYC review" ON public.seller_kyc_submissions;
CREATE POLICY "Admins update KYC review"
ON public.seller_kyc_submissions
FOR UPDATE
TO authenticated
USING (public.is_admin_account())
WITH CHECK (public.is_admin_account());

DROP POLICY IF EXISTS "Sellers manage own KYC documents" ON public.seller_kyc_documents;
CREATE POLICY "Sellers manage own KYC documents"
ON public.seller_kyc_documents
FOR ALL
TO authenticated
USING (public.is_seller_account() AND auth.uid() = user_id)
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read KYC documents" ON public.seller_kyc_documents;
CREATE POLICY "Admins read KYC documents"
ON public.seller_kyc_documents
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Sellers manage own warehouse" ON public.seller_warehouses;
CREATE POLICY "Sellers manage own warehouse"
ON public.seller_warehouses
FOR ALL
TO authenticated
USING (public.is_seller_account() AND auth.uid() = user_id)
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read warehouses" ON public.seller_warehouses;
CREATE POLICY "Admins read warehouses"
ON public.seller_warehouses
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Sellers manage own products" ON public.seller_products;
CREATE POLICY "Sellers manage own products"
ON public.seller_products
FOR ALL
TO authenticated
USING (public.is_seller_account() AND auth.uid() = user_id)
WITH CHECK (public.is_seller_account() AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read products" ON public.seller_products;
CREATE POLICY "Admins read products"
ON public.seller_products
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Admins review products" ON public.seller_products;
CREATE POLICY "Admins review products"
ON public.seller_products
FOR UPDATE
TO authenticated
USING (public.is_admin_account())
WITH CHECK (public.is_admin_account());

DROP POLICY IF EXISTS "Public read approved products" ON public.seller_products;
CREATE POLICY "Public read approved products"
ON public.seller_products
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Sellers manage own product specs" ON public.seller_product_specifications;
CREATE POLICY "Sellers manage own product specs"
ON public.seller_product_specifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins read product specs" ON public.seller_product_specifications;
CREATE POLICY "Admins read product specs"
ON public.seller_product_specifications
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Public read approved product specs" ON public.seller_product_specifications;
CREATE POLICY "Public read approved product specs"
ON public.seller_product_specifications
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Sellers manage own product variants" ON public.seller_product_variants;
CREATE POLICY "Sellers manage own product variants"
ON public.seller_product_variants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins read product variants" ON public.seller_product_variants;
CREATE POLICY "Admins read product variants"
ON public.seller_product_variants
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Public read approved product variants" ON public.seller_product_variants;
CREATE POLICY "Public read approved product variants"
ON public.seller_product_variants
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.approval_status = 'approved'
  )
);

DROP POLICY IF EXISTS "Sellers manage own product media" ON public.seller_product_media;
CREATE POLICY "Sellers manage own product media"
ON public.seller_product_media
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins read product media" ON public.seller_product_media;
CREATE POLICY "Admins read product media"
ON public.seller_product_media
FOR SELECT
TO authenticated
USING (public.is_admin_account());

DROP POLICY IF EXISTS "Public read approved product media" ON public.seller_product_media;
CREATE POLICY "Public read approved product media"
ON public.seller_product_media
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products p
    WHERE p.id = product_id AND p.approval_status = 'approved'
  )
);

GRANT SELECT, INSERT, UPDATE ON public.seller_kyc_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_kyc_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.seller_warehouses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_product_specifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_product_media TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.seller_product_specifications_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.seller_product_variants_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.seller_product_media_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.seller_kyc_documents_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.seller_products_id_seq TO authenticated;

REVOKE ALL ON FUNCTION public.generate_seller_kyc_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_seller_workflow_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_seller_kyc_submissions(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_seller_kyc(UUID, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_seller_product_submissions(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_seller_product(BIGINT, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_pending_admin_approvals() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_seller_product_listing(JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_seller_workflow_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_seller_kyc_submissions(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_seller_kyc(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_seller_product_submissions(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_seller_product(BIGINT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_pending_admin_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_seller_product_listing(JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'seller-kyc',
    'seller-kyc',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'seller-products',
    'seller-products',
    false,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Sellers upload own KYC files" ON storage.objects;
CREATE POLICY "Sellers upload own KYC files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-kyc'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Sellers read own KYC files" ON storage.objects;
CREATE POLICY "Sellers read own KYC files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-kyc'
  AND (
    public.is_admin_account()
    OR (public.is_seller_account() AND (storage.foldername(name))[1] = auth.uid()::TEXT)
  )
);

DROP POLICY IF EXISTS "Sellers update own KYC files" ON storage.objects;
CREATE POLICY "Sellers update own KYC files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seller-kyc'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
)
WITH CHECK (
  bucket_id = 'seller-kyc'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Sellers delete own KYC files" ON storage.objects;
CREATE POLICY "Sellers delete own KYC files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'seller-kyc'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Sellers upload own product media" ON storage.objects;
CREATE POLICY "Sellers upload own product media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-products'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Sellers read own product media files" ON storage.objects;
CREATE POLICY "Sellers read own product media files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-products'
  AND (
    public.is_admin_account()
    OR (public.is_seller_account() AND (storage.foldername(name))[1] = auth.uid()::TEXT)
  )
);

DROP POLICY IF EXISTS "Sellers update own product media files" ON storage.objects;
CREATE POLICY "Sellers update own product media files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seller-products'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
)
WITH CHECK (
  bucket_id = 'seller-products'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);

DROP POLICY IF EXISTS "Sellers delete own product media files" ON storage.objects;
CREATE POLICY "Sellers delete own product media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'seller-products'
  AND public.is_seller_account()
  AND (storage.foldername(name))[1] = auth.uid()::TEXT
);
