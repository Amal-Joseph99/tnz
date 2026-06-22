-- Sequential variant IDs + admin warehouse pickup sync support

CREATE SEQUENCE IF NOT EXISTS public.agt_default_variant_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.agt_variant_id_seq START 1;

CREATE OR REPLACE FUNCTION public.next_agt_variant_id(p_is_default BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next BIGINT;
BEGIN
  IF p_is_default THEN
    v_next := nextval('public.agt_default_variant_id_seq');
    RETURN 'AGT-D-VAR-' || LPAD(v_next::TEXT, 7, '0');
  END IF;

  v_next := nextval('public.agt_variant_id_seq');
  RETURN 'AGT-VAR-' || LPAD(v_next::TEXT, 7, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_agt_variant_id(
  p_variant_id TEXT,
  p_size TEXT,
  p_color TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_size TEXT := COALESCE(NULLIF(BTRIM(p_size), ''), 'Free Size');
  v_color TEXT := COALESCE(NULLIF(BTRIM(p_color), ''), 'No Color');
  v_is_default BOOLEAN;
BEGIN
  IF p_variant_id IS NOT NULL
    AND BTRIM(p_variant_id) <> ''
    AND BTRIM(p_variant_id) NOT IN ('AGT-DEFAULT-VAR')
    AND BTRIM(p_variant_id) ~ '^AGT-(D-)?VAR-[0-9]{7}$'
  THEN
    RETURN BTRIM(p_variant_id);
  END IF;

  v_is_default := v_size = 'Free Size'
    AND (v_color = 'No Color' OR v_color = '');

  RETURN public.next_agt_variant_id(v_is_default);
END;
$$;

ALTER TABLE public.seller_warehouses
  ADD COLUMN IF NOT EXISTS shiprocket_pickup_synced_at TIMESTAMPTZ;

ALTER TABLE public.shipping_provider_settings
  ADD COLUMN IF NOT EXISTS add_pickup_path TEXT;

UPDATE public.shipping_provider_settings
SET add_pickup_path = COALESCE(NULLIF(BTRIM(add_pickup_path), ''), '/v1/external/settings/company/addpickup')
WHERE provider = 'shiprocket';

CREATE OR REPLACE FUNCTION public.get_admin_warehouse(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  SELECT
    w.user_id,
    u.email::TEXT AS seller_email,
    sa.business_name,
    w.warehouse_id::TEXT,
    wat.tag_label AS address_tag_label,
    COALESCE(w.address_line_1, w.address_line) AS address_line_1,
    w.landmark,
    w.postal_code,
    w.city,
    w.state_name,
    w.country_name,
    w.latitude,
    w.longitude,
    w.location_label,
    w.contact_name,
    w.contact_email,
    w.contact_phone,
    wcr.role_label AS contact_role_label,
    w.operational_days,
    to_char(w.opening_time, 'HH24:MI') AS opening_time,
    to_char(w.closing_time, 'HH24:MI') AS closing_time,
    w.is_supplier_address,
    w.supplier_name,
    w.supplier_gstin,
    w.is_completed,
    w.shiprocket_pickup_location_name,
    w.shiprocket_pickup_synced_at,
    w.updated_at
  INTO v_row
  FROM public.seller_warehouses w
  JOIN auth.users u ON u.id = w.user_id
  LEFT JOIN public.seller_accounts sa ON sa.user_id = w.user_id
  LEFT JOIN public.warehouse_address_tags wat ON wat.id = w.address_tag_id
  LEFT JOIN public.warehouse_contact_roles wcr ON wcr.id = w.contact_role_id
  WHERE w.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_seller_warehouse(
  p_user_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  UPDATE public.seller_warehouses
  SET
    address_line_1 = COALESCE(NULLIF(BTRIM(p_payload->>'addressLine1'), ''), address_line_1),
    landmark = COALESCE(NULLIF(BTRIM(p_payload->>'landmark'), ''), landmark),
    postal_code = COALESCE(NULLIF(BTRIM(p_payload->>'postalCode'), ''), postal_code),
    city = COALESCE(NULLIF(BTRIM(p_payload->>'city'), ''), city),
    state_name = COALESCE(NULLIF(BTRIM(p_payload->>'stateName'), ''), state_name),
    country_name = COALESCE(NULLIF(BTRIM(p_payload->>'countryName'), ''), country_name),
    contact_name = COALESCE(NULLIF(BTRIM(p_payload->>'contactName'), ''), contact_name),
    contact_email = COALESCE(NULLIF(LOWER(BTRIM(p_payload->>'contactEmail')), ''), contact_email),
    contact_phone = COALESCE(NULLIF(BTRIM(p_payload->>'contactPhone'), ''), contact_phone),
    opening_time = COALESCE(NULLIF(BTRIM(p_payload->>'openingTime'), ''), '')::TIME,
    closing_time = COALESCE(NULLIF(BTRIM(p_payload->>'closingTime'), ''), '')::TIME,
    supplier_name = COALESCE(NULLIF(BTRIM(p_payload->>'supplierName'), ''), supplier_name),
    supplier_gstin = COALESCE(NULLIF(UPPER(BTRIM(p_payload->>'supplierGstin')), ''), supplier_gstin),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Warehouse not found.';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_warehouse_pickup_synced(
  p_user_id UUID,
  p_provider TEXT,
  p_pickup_location_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  IF p_provider <> 'shiprocket' THEN
    RAISE EXCEPTION 'Unsupported shipping provider.';
  END IF;

  UPDATE public.seller_warehouses
  SET
    shiprocket_pickup_location_name = NULLIF(BTRIM(p_pickup_location_name), ''),
    shiprocket_pickup_synced_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Warehouse not found.';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

DROP FUNCTION IF EXISTS public.list_admin_warehouses();

CREATE OR REPLACE FUNCTION public.list_admin_warehouses()
RETURNS TABLE (
  user_id UUID,
  seller_email TEXT,
  business_name TEXT,
  warehouse_id TEXT,
  address_tag_label TEXT,
  address_line_1 TEXT,
  landmark TEXT,
  postal_code TEXT,
  city TEXT,
  state_name TEXT,
  country_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_label TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role_label TEXT,
  operational_days TEXT[],
  opening_time TEXT,
  closing_time TEXT,
  is_supplier_address BOOLEAN,
  supplier_name TEXT,
  supplier_gstin TEXT,
  is_completed BOOLEAN,
  shiprocket_pickup_location_name TEXT,
  shiprocket_pickup_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    w.user_id,
    u.email::TEXT,
    sa.business_name,
    w.warehouse_id::TEXT,
    wat.tag_label,
    COALESCE(w.address_line_1, w.address_line),
    w.landmark,
    w.postal_code,
    w.city,
    w.state_name,
    w.country_name,
    w.latitude,
    w.longitude,
    w.location_label,
    w.contact_name,
    w.contact_email,
    w.contact_phone,
    wcr.role_label,
    w.operational_days,
    to_char(w.opening_time, 'HH24:MI'),
    to_char(w.closing_time, 'HH24:MI'),
    w.is_supplier_address,
    w.supplier_name,
    w.supplier_gstin,
    w.is_completed,
    w.shiprocket_pickup_location_name,
    w.shiprocket_pickup_synced_at,
    w.updated_at
  FROM public.seller_warehouses w
  JOIN auth.users u ON u.id = w.user_id
  LEFT JOIN public.seller_accounts sa ON sa.user_id = w.user_id
  LEFT JOIN public.warehouse_address_tags wat ON wat.id = w.address_tag_id
  LEFT JOIN public.warehouse_contact_roles wcr ON wcr.id = w.contact_role_id
  ORDER BY w.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_admin_warehouses() TO authenticated;

-- Patch save_seller_product_listing_draft variant IDs only (keep existing RPC signature)
CREATE OR REPLACE FUNCTION public.save_seller_product_listing_draft(
  p_product_id BIGINT,
  p_step INTEGER,
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
  v_variant_id TEXT;
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
    v_sku := public.generate_product_sku();

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
      p_step::SMALLINT,
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

    IF p_generate_sku OR public.product_listing_needs_sku(v_sku) THEN
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
      listing_step = p_step::SMALLINT,
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
    v_variant_id := public.resolve_agt_variant_id(
      v_variant->>'variantId',
      COALESCE(NULLIF(BTRIM(v_variant->>'size'), ''), 'Free Size'),
      COALESCE(NULLIF(BTRIM(v_variant->>'color'), ''), 'No Color')
    );

    INSERT INTO public.seller_product_variants (product_id, variant_id, size, color, mrp, selling_price, stock, image_storage_path, sort_order)
    VALUES (
      v_product_id,
      v_variant_id,
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

REVOKE ALL ON FUNCTION public.get_admin_warehouse(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_seller_warehouse(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_mark_warehouse_pickup_synced(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.next_agt_variant_id(BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_agt_variant_id(TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_admin_warehouse(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_seller_warehouse(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_warehouse_pickup_synced(UUID, TEXT, TEXT) TO authenticated;
