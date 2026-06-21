-- Product listing wizard: reference options, SKU sequence, draft save/load, extended product fields.

CREATE TABLE IF NOT EXISTS public.product_listing_item_conditions (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_warranty_periods (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_dimension_units (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_weight_units (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_return_windows (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_return_reason_types (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_size_presets (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.product_listing_color_presets (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.product_listing_item_conditions (code, label, sort_order)
VALUES ('brand_new', 'Brand New', 10)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_warranty_periods (code, label, sort_order)
VALUES
  ('7_days', '7 Days', 10),
  ('15_days', '15 Days', 20),
  ('30_days', '30 Days', 30),
  ('3_months', '3 Months', 40),
  ('6_months', '6 Months', 50),
  ('1_year', '1 Year', 60),
  ('2_years', '2 Years', 70),
  ('3_years', '3 Years', 80),
  ('5_years', '5 Years', 90)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_dimension_units (code, label, sort_order)
VALUES ('cm', 'cm', 10)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_weight_units (code, label, sort_order)
VALUES ('kg', 'kg', 10)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_return_windows (code, label, sort_order)
VALUES
  ('7_days', '7 Days', 10),
  ('10_days', '10 Days', 20),
  ('15_days', '15 Days', 30),
  ('30_days', '30 Days', 40)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_return_reason_types (code, label, sort_order)
VALUES
  ('any_reason', 'Any Reason Return', 10),
  ('damaged_only', 'Damaged Product Only', 20),
  ('defective_only', 'Defective Product Only', 30),
  ('wrong_item', 'Wrong Item Received', 40),
  ('not_as_described', 'Not As Described', 50),
  ('multiple_reasons', 'Multiple Reasons', 60)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_size_presets (code, label, sort_order)
VALUES
  ('free_size', 'Free Size', 10),
  ('xs', 'XS', 20),
  ('s', 'S', 30),
  ('m', 'M', 40),
  ('l', 'L', 50),
  ('xl', 'XL', 60),
  ('xxl', 'XXL', 70)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

INSERT INTO public.product_listing_color_presets (code, label, sort_order)
VALUES
  ('no_color', 'No Color', 10),
  ('black', 'Black', 20),
  ('white', 'White', 30),
  ('red', 'Red', 40),
  ('blue', 'Blue', 50),
  ('green', 'Green', 60),
  ('yellow', 'Yellow', 70),
  ('multicolor', 'Multicolor', 80)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = true;

CREATE TABLE IF NOT EXISTS public.product_sku_counters (
  year_suffix SMALLINT PRIMARY KEY,
  counter BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE public.seller_products
  ADD COLUMN IF NOT EXISTS item_condition_code TEXT,
  ADD COLUMN IF NOT EXISTS full_description_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS package_contents_bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_instructions TEXT,
  ADD COLUMN IF NOT EXISTS important_note TEXT,
  ADD COLUMN IF NOT EXISTS warranty_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS warranty_period_code TEXT,
  ADD COLUMN IF NOT EXISTS warranty_type TEXT,
  ADD COLUMN IF NOT EXISTS contains_battery BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_liquid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_magnetic_material BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_aerosol BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contains_flammable_material BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS package_length_unit_code TEXT,
  ADD COLUMN IF NOT EXISTS package_width_unit_code TEXT,
  ADD COLUMN IF NOT EXISTS package_height_unit_code TEXT,
  ADD COLUMN IF NOT EXISTS package_weight_unit_code TEXT,
  ADD COLUMN IF NOT EXISTS return_eligible BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_window_code TEXT,
  ADD COLUMN IF NOT EXISTS return_reason_codes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS listing_step SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS declaration_accurate BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_policy BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_legal_right BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_terms BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ;

ALTER TABLE public.seller_products
  ALTER COLUMN packing_type DROP NOT NULL,
  ALTER COLUMN weight_kg DROP NOT NULL,
  ALTER COLUMN package_length_cm DROP NOT NULL,
  ALTER COLUMN package_width_cm DROP NOT NULL,
  ALTER COLUMN package_height_cm DROP NOT NULL,
  ALTER COLUMN manufacturer_name DROP NOT NULL,
  ALTER COLUMN manufacturer_country DROP NOT NULL,
  ALTER COLUMN origin_country DROP NOT NULL;

ALTER TABLE public.seller_products DROP CONSTRAINT IF EXISTS seller_products_fields_not_empty;
ALTER TABLE public.seller_products
  ADD CONSTRAINT seller_products_fields_not_empty CHECK (
    BTRIM(product_name) <> ''
    AND BTRIM(brand_name) <> ''
    AND BTRIM(sku) <> ''
  );

ALTER TABLE public.seller_product_media DROP CONSTRAINT IF EXISTS seller_product_media_slot_index_check;
ALTER TABLE public.seller_product_media
  ADD CONSTRAINT seller_product_media_slot_index_check
  CHECK (slot_index IS NULL OR (slot_index >= 1 AND slot_index <= 10));

CREATE OR REPLACE FUNCTION public.generate_product_sku()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  yr SMALLINT := (EXTRACT(YEAR FROM NOW())::INT % 100);
  next_counter BIGINT;
BEGIN
  INSERT INTO public.product_sku_counters (year_suffix, counter)
  VALUES (yr, 1)
  ON CONFLICT (year_suffix) DO UPDATE
  SET counter = public.product_sku_counters.counter + 1
  RETURNING counter INTO next_counter;

  RETURN 'SKUAT' || LPAD(yr::TEXT, 2, '0') || LPAD(next_counter::TEXT, 7, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.list_product_listing_wizard_options()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'itemConditions', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_item_conditions WHERE is_active), '[]'::jsonb),
    'warrantyPeriods', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_warranty_periods WHERE is_active), '[]'::jsonb),
    'dimensionUnits', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_dimension_units WHERE is_active), '[]'::jsonb),
    'weightUnits', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_weight_units WHERE is_active), '[]'::jsonb),
    'returnWindows', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_return_windows WHERE is_active), '[]'::jsonb),
    'returnReasonTypes', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_return_reason_types WHERE is_active), '[]'::jsonb),
    'sizePresets', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_size_presets WHERE is_active), '[]'::jsonb),
    'colorPresets', COALESCE((SELECT jsonb_agg(jsonb_build_object('code', code, 'label', label, 'sortOrder', sort_order) ORDER BY sort_order) FROM public.product_listing_color_presets WHERE is_active), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_seller_product_listing_draft(p_product_id BIGINT)
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
  WHERE id = p_product_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  RETURN jsonb_build_object(
    'sku', v_product.sku,
    'approvalStatus', v_product.approval_status,
    'listingStep', v_product.listing_step,
    'categoryName', v_product.category_name,
    'subCategoryName', v_product.sub_category_name,
    'productTypeName', v_product.product_type_name,
    'hsnCode', v_product.hsn_code,
    'itemConditionCode', COALESCE(v_product.item_condition_code, 'brand_new'),
    'productName', v_product.product_name,
    'brandName', v_product.brand_name,
    'shortDescription', COALESCE(v_product.short_description, ''),
    'fullDescriptionBullets', COALESCE(v_product.full_description_bullets, '[]'::jsonb),
    'specifications', COALESCE((SELECT jsonb_agg(jsonb_build_object('attributeName', s.attribute_name, 'attributeValue', s.attribute_value, 'sortOrder', s.sort_order) ORDER BY s.sort_order) FROM public.seller_product_specifications s WHERE s.product_id = v_product.id), '[]'::jsonb),
    'manufacturerName', COALESCE(v_product.manufacturer_name, ''),
    'manufacturerCountry', COALESCE(v_product.manufacturer_country, ''),
    'originCountry', COALESCE(v_product.origin_country, ''),
    'ingredients', COALESCE(v_product.ingredients, ''),
    'usageInstructions', COALESCE(v_product.usage_instructions, v_product.usage_note, ''),
    'importantNote', COALESCE(v_product.important_note, ''),
    'warrantyAvailable', v_product.warranty_available,
    'warrantyPeriodCode', COALESCE(v_product.warranty_period_code, ''),
    'warrantyType', COALESCE(v_product.warranty_type, ''),
    'containsBattery', v_product.contains_battery,
    'containsLiquid', v_product.contains_liquid,
    'containsMagneticMaterial', v_product.contains_magnetic_material,
    'containsAerosol', v_product.contains_aerosol,
    'containsFlammableMaterial', v_product.contains_flammable_material,
    'packageContentsBullets', COALESCE(v_product.package_contents_bullets, '[]'::jsonb),
    'variants', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', v.id, 'variantId', v.variant_id, 'size', v.size, 'color', v.color, 'mrp', v.mrp, 'sellingPrice', v.selling_price, 'stock', v.stock, 'imageStoragePath', v.image_storage_path, 'fileName', split_part(v.image_storage_path, '/', -1), 'sortOrder', v.sort_order) ORDER BY v.sort_order) FROM public.seller_product_variants v WHERE v.product_id = v_product.id), '[]'::jsonb),
    'media', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'mediaType', m.media_type, 'storagePath', m.storage_path, 'fileName', m.file_name, 'mimeType', m.mime_type, 'slotIndex', m.slot_index, 'sortOrder', m.sort_order) ORDER BY m.sort_order) FROM public.seller_product_media m WHERE m.product_id = v_product.id), '[]'::jsonb),
    'packageLength', COALESCE(v_product.package_length_cm, 0),
    'packageWidth', COALESCE(v_product.package_width_cm, 0),
    'packageHeight', COALESCE(v_product.package_height_cm, 0),
    'packageLengthUnitCode', COALESCE(v_product.package_length_unit_code, 'cm'),
    'packageWidthUnitCode', COALESCE(v_product.package_width_unit_code, 'cm'),
    'packageHeightUnitCode', COALESCE(v_product.package_height_unit_code, 'cm'),
    'packageWeight', COALESCE(v_product.weight_kg, 0),
    'packageWeightUnitCode', COALESCE(v_product.package_weight_unit_code, 'kg'),
    'returnEligible', v_product.return_eligible,
    'returnWindowCode', COALESCE(v_product.return_window_code, ''),
    'returnReasonCodes', COALESCE(v_product.return_reason_codes, '{}'),
    'declarationAccurate', v_product.declaration_accurate,
    'declarationPolicy', v_product.declaration_policy,
    'declarationLegalRight', v_product.declaration_legal_right,
    'declarationTerms', v_product.declaration_terms
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_seller_product_listing_draft(
  p_product_id BIGINT,
  p_step SMALLINT,
  p_generate_sku BOOLEAN,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_product_id BIGINT := p_product_id;
  v_sku TEXT;
  v_spec JSONB;
  v_variant JSONB;
  v_media JSONB;
BEGIN
  IF NOT public.is_seller_account() OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.seller_warehouses WHERE user_id = v_user_id AND is_completed = true
  ) THEN
    RAISE EXCEPTION 'Warehouse setup must be completed first.';
  END IF;

  IF v_product_id IS NULL THEN
    v_sku := CASE WHEN p_generate_sku THEN public.generate_product_sku() ELSE 'DRAFT-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12) END;

    INSERT INTO public.seller_products (
      user_id, sku, product_name, brand_name, category_name, sub_category_name, product_type_name,
      hsn_code, item_condition_code, short_description, full_description_bullets,
      manufacturer_name, manufacturer_country, origin_country, ingredients, usage_instructions,
      important_note, warranty_available, warranty_period_code, warranty_type,
      contains_battery, contains_liquid, contains_magnetic_material, contains_aerosol, contains_flammable_material,
      package_contents_bullets, package_length_cm, package_width_cm, package_height_cm, weight_kg,
      package_length_unit_code, package_width_unit_code, package_height_unit_code, package_weight_unit_code,
      return_eligible, return_window_code, return_reason_codes, listing_step, approval_status, draft_saved_at,
      declaration_accurate, declaration_policy, declaration_legal_right, declaration_terms
    ) VALUES (
      v_user_id,
      v_sku,
      COALESCE(NULLIF(BTRIM(p_payload->>'productName'), ''), 'Draft product'),
      COALESCE(NULLIF(BTRIM(p_payload->>'brandName'), ''), 'Draft brand'),
      COALESCE(NULLIF(BTRIM(p_payload->>'categoryName'), ''), 'Uncategorized'),
      COALESCE(NULLIF(BTRIM(p_payload->>'subCategoryName'), ''), 'General'),
      COALESCE(NULLIF(BTRIM(p_payload->>'productTypeName'), ''), 'General'),
      COALESCE(NULLIF(BTRIM(p_payload->>'hsnCode'), ''), '00000000'),
      COALESCE(NULLIF(BTRIM(p_payload->>'itemConditionCode'), ''), 'brand_new'),
      NULLIF(BTRIM(p_payload->>'shortDescription'), ''),
      COALESCE(p_payload->'fullDescriptionBullets', '[]'::jsonb),
      NULLIF(BTRIM(p_payload->>'manufacturerName'), ''),
      NULLIF(BTRIM(p_payload->>'manufacturerCountry'), ''),
      NULLIF(BTRIM(p_payload->>'originCountry'), ''),
      NULLIF(BTRIM(p_payload->>'ingredients'), ''),
      NULLIF(BTRIM(p_payload->>'usageInstructions'), ''),
      NULLIF(BTRIM(p_payload->>'importantNote'), ''),
      COALESCE((p_payload->>'warrantyAvailable')::BOOLEAN, false),
      NULLIF(BTRIM(p_payload->>'warrantyPeriodCode'), ''),
      NULLIF(BTRIM(p_payload->>'warrantyType'), ''),
      COALESCE((p_payload->>'containsBattery')::BOOLEAN, false),
      COALESCE((p_payload->>'containsLiquid')::BOOLEAN, false),
      COALESCE((p_payload->>'containsMagneticMaterial')::BOOLEAN, false),
      COALESCE((p_payload->>'containsAerosol')::BOOLEAN, false),
      COALESCE((p_payload->>'containsFlammableMaterial')::BOOLEAN, false),
      COALESCE(p_payload->'packageContentsBullets', '[]'::jsonb),
      NULLIF(p_payload->>'packageLength', '')::NUMERIC,
      NULLIF(p_payload->>'packageWidth', '')::NUMERIC,
      NULLIF(p_payload->>'packageHeight', '')::NUMERIC,
      NULLIF(p_payload->>'packageWeight', '')::NUMERIC,
      NULLIF(BTRIM(p_payload->>'packageLengthUnitCode'), ''),
      NULLIF(BTRIM(p_payload->>'packageWidthUnitCode'), ''),
      NULLIF(BTRIM(p_payload->>'packageHeightUnitCode'), ''),
      NULLIF(BTRIM(p_payload->>'packageWeightUnitCode'), ''),
      COALESCE((p_payload->>'returnEligible')::BOOLEAN, false),
      NULLIF(BTRIM(p_payload->>'returnWindowCode'), ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'returnReasonCodes', '[]'::jsonb))), '{}'),
      p_step,
      'draft',
      NOW(),
      COALESCE((p_payload->>'declarationAccurate')::BOOLEAN, false),
      COALESCE((p_payload->>'declarationPolicy')::BOOLEAN, false),
      COALESCE((p_payload->>'declarationLegalRight')::BOOLEAN, false),
      COALESCE((p_payload->>'declarationTerms')::BOOLEAN, false)
    )
    RETURNING id, sku INTO v_product_id, v_sku;
  ELSE
    SELECT sku INTO v_sku FROM public.seller_products WHERE id = v_product_id AND user_id = v_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found.';
    END IF;

    IF p_generate_sku AND v_sku LIKE 'DRAFT-%' THEN
      v_sku := public.generate_product_sku();
    END IF;

    UPDATE public.seller_products
    SET
      sku = v_sku,
      product_name = COALESCE(NULLIF(BTRIM(p_payload->>'productName'), ''), product_name),
      brand_name = COALESCE(NULLIF(BTRIM(p_payload->>'brandName'), ''), brand_name),
      category_name = COALESCE(NULLIF(BTRIM(p_payload->>'categoryName'), ''), category_name),
      sub_category_name = COALESCE(NULLIF(BTRIM(p_payload->>'subCategoryName'), ''), sub_category_name),
      product_type_name = COALESCE(NULLIF(BTRIM(p_payload->>'productTypeName'), ''), product_type_name),
      hsn_code = COALESCE(NULLIF(BTRIM(p_payload->>'hsnCode'), ''), hsn_code),
      item_condition_code = COALESCE(NULLIF(BTRIM(p_payload->>'itemConditionCode'), ''), item_condition_code),
      short_description = NULLIF(BTRIM(p_payload->>'shortDescription'), ''),
      full_description_bullets = COALESCE(p_payload->'fullDescriptionBullets', full_description_bullets),
      manufacturer_name = NULLIF(BTRIM(p_payload->>'manufacturerName'), ''),
      manufacturer_country = NULLIF(BTRIM(p_payload->>'manufacturerCountry'), ''),
      origin_country = NULLIF(BTRIM(p_payload->>'originCountry'), ''),
      ingredients = NULLIF(BTRIM(p_payload->>'ingredients'), ''),
      usage_instructions = NULLIF(BTRIM(p_payload->>'usageInstructions'), ''),
      important_note = NULLIF(BTRIM(p_payload->>'importantNote'), ''),
      warranty_available = COALESCE((p_payload->>'warrantyAvailable')::BOOLEAN, warranty_available),
      warranty_period_code = NULLIF(BTRIM(p_payload->>'warrantyPeriodCode'), ''),
      warranty_type = NULLIF(BTRIM(p_payload->>'warrantyType'), ''),
      contains_battery = COALESCE((p_payload->>'containsBattery')::BOOLEAN, contains_battery),
      contains_liquid = COALESCE((p_payload->>'containsLiquid')::BOOLEAN, contains_liquid),
      contains_magnetic_material = COALESCE((p_payload->>'containsMagneticMaterial')::BOOLEAN, contains_magnetic_material),
      contains_aerosol = COALESCE((p_payload->>'containsAerosol')::BOOLEAN, contains_aerosol),
      contains_flammable_material = COALESCE((p_payload->>'containsFlammableMaterial')::BOOLEAN, contains_flammable_material),
      package_contents_bullets = COALESCE(p_payload->'packageContentsBullets', package_contents_bullets),
      package_length_cm = NULLIF(p_payload->>'packageLength', '')::NUMERIC,
      package_width_cm = NULLIF(p_payload->>'packageWidth', '')::NUMERIC,
      package_height_cm = NULLIF(p_payload->>'packageHeight', '')::NUMERIC,
      weight_kg = NULLIF(p_payload->>'packageWeight', '')::NUMERIC,
      package_length_unit_code = NULLIF(BTRIM(p_payload->>'packageLengthUnitCode'), ''),
      package_width_unit_code = NULLIF(BTRIM(p_payload->>'packageWidthUnitCode'), ''),
      package_height_unit_code = NULLIF(BTRIM(p_payload->>'packageHeightUnitCode'), ''),
      package_weight_unit_code = NULLIF(BTRIM(p_payload->>'packageWeightUnitCode'), ''),
      return_eligible = COALESCE((p_payload->>'returnEligible')::BOOLEAN, return_eligible),
      return_window_code = NULLIF(BTRIM(p_payload->>'returnWindowCode'), ''),
      return_reason_codes = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'returnReasonCodes', '[]'::jsonb))), return_reason_codes),
      listing_step = p_step,
      draft_saved_at = NOW(),
      declaration_accurate = COALESCE((p_payload->>'declarationAccurate')::BOOLEAN, declaration_accurate),
      declaration_policy = COALESCE((p_payload->>'declarationPolicy')::BOOLEAN, declaration_policy),
      declaration_legal_right = COALESCE((p_payload->>'declarationLegalRight')::BOOLEAN, declaration_legal_right),
      declaration_terms = COALESCE((p_payload->>'declarationTerms')::BOOLEAN, declaration_terms),
      approval_status = CASE WHEN approval_status = 'approved' THEN 'draft' ELSE approval_status END
    WHERE id = v_product_id AND user_id = v_user_id;
  END IF;

  DELETE FROM public.seller_product_specifications WHERE product_id = v_product_id;
  DELETE FROM public.seller_product_variants WHERE product_id = v_product_id;
  DELETE FROM public.seller_product_media WHERE product_id = v_product_id;

  FOR v_spec IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'specifications', '[]'::jsonb))
  LOOP
    IF COALESCE(BTRIM(v_spec->>'attributeName'), '') <> '' AND COALESCE(BTRIM(v_spec->>'attributeValue'), '') <> '' THEN
      INSERT INTO public.seller_product_specifications (product_id, attribute_name, attribute_value, sort_order)
      VALUES (v_product_id, v_spec->>'attributeName', v_spec->>'attributeValue', COALESCE((v_spec->>'sortOrder')::INT, 0));
    END IF;
  END LOOP;

  FOR v_variant IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'variants', '[]'::jsonb))
  LOOP
    INSERT INTO public.seller_product_variants (product_id, variant_id, size, color, mrp, selling_price, stock, image_storage_path, sort_order)
    VALUES (
      v_product_id,
      COALESCE(NULLIF(BTRIM(v_variant->>'variantId'), ''), 'AGT-DEFAULT-VAR'),
      COALESCE(NULLIF(BTRIM(v_variant->>'size'), ''), 'Free Size'),
      COALESCE(NULLIF(BTRIM(v_variant->>'color'), ''), 'No Color'),
      COALESCE((v_variant->>'mrp')::NUMERIC, 0),
      COALESCE((v_variant->>'sellingPrice')::NUMERIC, 0),
      COALESCE((v_variant->>'stock')::INT, 0),
      NULLIF(BTRIM(v_variant->>'imageStoragePath'), ''),
      COALESCE((v_variant->>'sortOrder')::INT, 0)
    );
  END LOOP;

  FOR v_media IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'media', '[]'::jsonb))
  LOOP
    INSERT INTO public.seller_product_media (product_id, media_type, storage_path, file_name, mime_type, slot_index, sort_order)
    VALUES (
      v_product_id,
      v_media->>'mediaType',
      v_media->>'storagePath',
      v_media->>'fileName',
      NULLIF(BTRIM(v_media->>'mimeType'), ''),
      NULLIF(v_media->>'slotIndex', '')::INT,
      COALESCE((v_media->>'sortOrder')::INT, 0)
    );
  END LOOP;

  RETURN jsonb_build_object('productId', v_product_id, 'sku', v_sku);
END;
$$;

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
  PERFORM public.save_seller_product_listing_draft(p_product_id, 5, false, p_payload);

  UPDATE public.seller_products
  SET approval_status = 'pending', submitted_at = NOW(), listing_step = 5
  WHERE id = p_product_id AND user_id = auth.uid();
END;
$$;

ALTER TABLE public.product_listing_item_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_warranty_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_dimension_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_weight_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_return_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_return_reason_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_size_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_listing_color_presets ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'product_listing_item_conditions',
    'product_listing_warranty_periods',
    'product_listing_dimension_units',
    'product_listing_weight_units',
    'product_listing_return_windows',
    'product_listing_return_reason_types',
    'product_listing_size_presets',
    'product_listing_color_presets'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public read %s" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public read %s" ON public.%I FOR SELECT TO anon, authenticated USING (is_active)', tbl, tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', tbl);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.generate_product_sku() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_product_listing_wizard_options() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_seller_product_listing_draft(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_seller_product_listing_draft(BIGINT, SMALLINT, BOOLEAN, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_seller_product_listing(BIGINT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_product_listing_wizard_options() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_product_listing_draft(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_seller_product_listing_draft(BIGINT, SMALLINT, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_seller_product_listing(BIGINT, JSONB) TO authenticated;

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/seller/products/new/step/*', ARRAY['seller'], '/seller/dashboard', 80),
  ('/seller/products/*/edit/step/*', ARRAY['seller'], '/seller/dashboard', 80)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;
