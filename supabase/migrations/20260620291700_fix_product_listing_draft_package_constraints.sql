-- Allow incomplete package dimensions on draft saves (wizard steps 1–4).
-- Zero sent from the client is treated as unset; submit still requires positive values.

CREATE OR REPLACE FUNCTION public.listing_wizard_optional_positive_numeric(p_value TEXT)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NULLIF(BTRIM($1), '') IS NULL THEN NULL
    WHEN (NULLIF(BTRIM($1), ''))::NUMERIC <= 0 THEN NULL
    ELSE (NULLIF(BTRIM($1), ''))::NUMERIC
  END;
$$;

ALTER TABLE public.seller_products DROP CONSTRAINT IF EXISTS seller_products_package_height_cm_check;
ALTER TABLE public.seller_products DROP CONSTRAINT IF EXISTS seller_products_package_length_cm_check;
ALTER TABLE public.seller_products DROP CONSTRAINT IF EXISTS seller_products_package_width_cm_check;
ALTER TABLE public.seller_products DROP CONSTRAINT IF EXISTS seller_products_weight_kg_check;

ALTER TABLE public.seller_products
  ADD CONSTRAINT seller_products_package_height_cm_check
    CHECK (package_height_cm IS NULL OR package_height_cm > 0),
  ADD CONSTRAINT seller_products_package_length_cm_check
    CHECK (package_length_cm IS NULL OR package_length_cm > 0),
  ADD CONSTRAINT seller_products_package_width_cm_check
    CHECK (package_width_cm IS NULL OR package_width_cm > 0),
  ADD CONSTRAINT seller_products_weight_kg_check
    CHECK (weight_kg IS NULL OR weight_kg > 0);

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
      public.listing_wizard_optional_positive_numeric(p_payload->>'packageLength'),
      public.listing_wizard_optional_positive_numeric(p_payload->>'packageWidth'),
      public.listing_wizard_optional_positive_numeric(p_payload->>'packageHeight'),
      public.listing_wizard_optional_positive_numeric(p_payload->>'packageWeight'),
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
      package_length_cm = public.listing_wizard_optional_positive_numeric(p_payload->>'packageLength'),
      package_width_cm = public.listing_wizard_optional_positive_numeric(p_payload->>'packageWidth'),
      package_height_cm = public.listing_wizard_optional_positive_numeric(p_payload->>'packageHeight'),
      weight_kg = public.listing_wizard_optional_positive_numeric(p_payload->>'packageWeight'),
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_products sp
    WHERE sp.id = p_product_id
      AND sp.user_id = auth.uid()
      AND sp.package_length_cm > 0
      AND sp.package_width_cm > 0
      AND sp.package_height_cm > 0
      AND sp.weight_kg > 0
  ) THEN
    RAISE EXCEPTION 'Package dimensions and weight are required before submission.';
  END IF;

  UPDATE public.seller_products
  SET approval_status = 'pending', submitted_at = NOW(), listing_step = 5
  WHERE id = p_product_id AND user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.listing_wizard_optional_positive_numeric(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_seller_product_listing_draft(BIGINT, SMALLINT, BOOLEAN, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_seller_product_listing(BIGINT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_seller_product_listing_draft(BIGINT, SMALLINT, BOOLEAN, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_seller_product_listing(BIGINT, JSONB) TO authenticated;
