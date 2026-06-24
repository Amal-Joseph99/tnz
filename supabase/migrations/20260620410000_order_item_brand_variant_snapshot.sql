-- Snapshot cart variant labels (brand, size, color) on each order line.

ALTER TABLE public.marketplace_order_items
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS variant_size TEXT,
  ADD COLUMN IF NOT EXISTS variant_color TEXT;

CREATE OR REPLACE FUNCTION public.create_marketplace_order(
  p_seller_user_id UUID,
  p_payment_method public.marketplace_payment_method,
  p_currency_code CHAR(3),
  p_subtotal NUMERIC,
  p_shipping_amount NUMERIC,
  p_cod_charges_amount NUMERIC,
  p_tax_amount NUMERIC,
  p_total_amount NUMERIC,
  p_delivery JSONB,
  p_shipping_quote JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer UUID := auth.uid();
  v_order_id BIGINT;
  v_order_number TEXT;
  v_lane public.shipping_lane;
  v_origin_iso2 CHAR(2);
  v_pickup_postcode TEXT;
  v_item JSONB;
  v_product public.seller_products%ROWTYPE;
  v_variant public.seller_product_variants%ROWTYPE;
  v_order_status public.marketplace_order_status;
  v_payment_status public.marketplace_payment_status;
  v_expected_total NUMERIC(12, 2);
  v_line_total NUMERIC(12, 2);
  v_computed_subtotal NUMERIC(12, 2) := 0;
  v_variant_key TEXT;
BEGIN
  IF v_buyer IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_india_origin_seller(p_seller_user_id) THEN
    RAISE EXCEPTION 'Shiprocket shipping is only available for India-origin sellers.';
  END IF;

  v_expected_total := ROUND(
    p_subtotal
    + p_shipping_amount
    + COALESCE(p_cod_charges_amount, 0),
    2
  );

  IF COALESCE(p_tax_amount, 0) <> 0 THEN
    RAISE EXCEPTION 'Checkout tax is not collected separately.';
  END IF;

  IF ABS(p_total_amount - v_expected_total) > 0.02 THEN
    RAISE EXCEPTION 'Order total mismatch.';
  END IF;

  SELECT sa.iso_alpha2 INTO v_origin_iso2
  FROM public.seller_accounts sa
  WHERE sa.user_id = p_seller_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller account not found.';
  END IF;

  SELECT w.postal_code
  INTO v_pickup_postcode
  FROM public.seller_warehouses w
  WHERE w.user_id = p_seller_user_id
    AND w.is_completed = true;

  IF v_pickup_postcode IS NULL THEN
    RAISE EXCEPTION 'Seller warehouse pickup postcode is not configured.';
  END IF;

  v_lane := public.resolve_shipping_lane(v_origin_iso2, upper(btrim(p_delivery->>'countryIso2'))::CHAR(2));

  IF v_lane = 'india_international' AND p_payment_method = 'cod' THEN
    RAISE EXCEPTION 'Cash on delivery is not available for international shipments.';
  END IF;

  IF v_lane = 'india_domestic' AND p_payment_method = 'cod' AND COALESCE((p_shipping_quote->>'codAvailable')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Cash on delivery is not serviceable for this domestic address.';
  END IF;

  IF p_payment_method = 'prepaid' THEN
    v_order_status := 'awaiting_payment';
    v_payment_status := 'pending';
  ELSE
    v_order_status := 'pending_seller_acceptance';
    v_payment_status := 'not_required';
  END IF;

  v_order_number := public.generate_marketplace_order_number();

  INSERT INTO public.marketplace_orders (
    order_number,
    buyer_user_id,
    seller_user_id,
    status,
    payment_method,
    payment_status,
    shipping_lane,
    currency_code,
    subtotal_amount,
    shipping_amount,
    cod_charges_amount,
    tax_amount,
    total_amount,
    pickup_postcode,
    delivery_full_name,
    delivery_phone,
    delivery_email,
    delivery_address_line1,
    delivery_address_line2,
    delivery_city,
    delivery_state,
    delivery_postcode,
    delivery_country_iso2,
    package_weight_kg,
    package_length_cm,
    package_width_cm,
    package_height_cm,
    shipping_courier_company_id,
    shipping_courier_name,
    shipping_estimated_delivery
  )
  VALUES (
    v_order_number,
    v_buyer,
    p_seller_user_id,
    v_order_status,
    p_payment_method,
    v_payment_status,
    v_lane,
    upper(p_currency_code),
    0,
    p_shipping_amount,
    COALESCE(p_cod_charges_amount, 0),
    0,
    v_expected_total,
    v_pickup_postcode,
    btrim(p_delivery->>'fullName'),
    btrim(p_delivery->>'phone'),
    lower(btrim(p_delivery->>'email')),
    btrim(p_delivery->>'addressLine1'),
    NULLIF(btrim(p_delivery->>'addressLine2'), ''),
    btrim(p_delivery->>'city'),
    btrim(p_delivery->>'state'),
    btrim(p_delivery->>'postcode'),
    upper(btrim(p_delivery->>'countryIso2'))::CHAR(2),
    (p_shipping_quote->>'weightKg')::NUMERIC,
    NULLIF(p_shipping_quote->>'lengthCm', '')::NUMERIC,
    NULLIF(p_shipping_quote->>'widthCm', '')::NUMERIC,
    NULLIF(p_shipping_quote->>'heightCm', '')::NUMERIC,
    NULLIF(p_shipping_quote->>'courierCompanyId', '')::BIGINT,
    NULLIF(p_shipping_quote->>'courierName', ''),
    NULLIF(p_shipping_quote->>'estimatedDelivery', '')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product
    FROM public.seller_products
    WHERE id = (v_item->>'productId')::BIGINT
      AND user_id = p_seller_user_id
      AND approval_status = 'approved';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not available from this seller.', v_item->>'productId';
    END IF;

    v_variant_key := NULLIF(btrim(v_item->>'variantId'), '');

    IF v_variant_key IS NOT NULL THEN
      SELECT * INTO v_variant
      FROM public.seller_product_variants
      WHERE product_id = v_product.id
        AND (
          (v_variant_key ~ '^[0-9]+$' AND id = v_variant_key::BIGINT)
          OR variant_id = v_variant_key
        )
      ORDER BY id
      LIMIT 1;
    ELSE
      SELECT * INTO v_variant
      FROM public.seller_product_variants
      WHERE product_id = v_product.id
      ORDER BY sort_order, id
      LIMIT 1;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No sellable variant found for product %.', v_product.id;
    END IF;

    IF v_variant.stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for %.', v_product.product_name;
    END IF;

    v_line_total := ROUND(v_variant.selling_price * (v_item->>'quantity')::INT, 2);

    INSERT INTO public.marketplace_order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      brand_name,
      variant_size,
      variant_color,
      sku,
      hsn_code,
      quantity,
      unit_price,
      line_total
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_variant.id,
      v_product.product_name,
      COALESCE(NULLIF(btrim(v_item->>'brand'), ''), v_product.brand_name),
      COALESCE(NULLIF(btrim(v_item->>'variantSize'), ''), NULLIF(btrim(v_variant.size), '')),
      COALESCE(NULLIF(btrim(v_item->>'variantColor'), ''), NULLIF(btrim(v_variant.color), '')),
      COALESCE(NULLIF(btrim(v_item->>'sku'), ''), v_product.sku),
      v_product.hsn_code,
      (v_item->>'quantity')::INT,
      v_variant.selling_price,
      v_line_total
    );

    v_computed_subtotal := v_computed_subtotal + v_line_total;

    IF p_payment_method = 'cod' THEN
      UPDATE public.seller_product_variants
      SET stock = stock - (v_item->>'quantity')::INT
      WHERE id = v_variant.id
        AND stock >= (v_item->>'quantity')::INT;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for %.', v_product.product_name;
      END IF;
    END IF;
  END LOOP;

  IF ABS(v_computed_subtotal - p_subtotal) > 0.02 THEN
    RAISE EXCEPTION 'Subtotal mismatch.';
  END IF;

  UPDATE public.marketplace_orders
  SET subtotal_amount = v_computed_subtotal
  WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'shippingLane', v_lane::TEXT,
    'requiresPayment', p_payment_method = 'prepaid'
  );
END;
$$;
