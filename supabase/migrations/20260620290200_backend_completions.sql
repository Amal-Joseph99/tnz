-- Backend completion: grants, hardened orders, returns, contact, admin lists, buyer profile

-- ---------------------------------------------------------------------------
-- Platform settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  checkout_tax_rate NUMERIC(8, 4) NOT NULL DEFAULT 0.05 CHECK (checkout_tax_rate >= 0),
  return_window_days INT NOT NULL DEFAULT 14 CHECK (return_window_days > 0),
  stale_payment_hours INT NOT NULL DEFAULT 24 CHECK (stale_payment_hours > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
CREATE POLICY "Public read platform settings"
ON public.platform_settings
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.platform_settings TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Missing table grants
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT SELECT ON public.marketplace_order_shipments TO authenticated;
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT SELECT, UPDATE ON public.buyer_profiles TO authenticated;
GRANT SELECT, UPDATE ON public.seller_accounts TO authenticated;

ALTER TABLE public.buyer_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

DROP POLICY IF EXISTS "Buyers insert own profile" ON public.buyer_profiles;
CREATE POLICY "Buyers insert own profile"
ON public.buyer_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

GRANT INSERT ON public.buyer_profiles TO authenticated;

DROP POLICY IF EXISTS "Deny shiprocket auth cache access" ON public.shiprocket_auth_cache;
CREATE POLICY "Deny shiprocket auth cache access"
ON public.shiprocket_auth_cache
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Buyer saved addresses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_addresses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country_iso2 CHAR(2) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT buyer_addresses_not_empty CHECK (
    btrim(full_name) <> ''
    AND btrim(phone) <> ''
    AND btrim(address_line1) <> ''
    AND btrim(city) <> ''
    AND btrim(state) <> ''
    AND btrim(postcode) <> ''
  )
);

CREATE INDEX IF NOT EXISTS buyer_addresses_user_idx ON public.buyer_addresses (user_id, is_default DESC, id DESC);

ALTER TABLE public.buyer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own addresses" ON public.buyer_addresses;
CREATE POLICY "Buyers manage own addresses"
ON public.buyer_addresses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_addresses TO authenticated;

-- ---------------------------------------------------------------------------
-- Guest contact messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic_key TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_messages_not_empty CHECK (
    btrim(full_name) <> ''
    AND btrim(email) <> ''
    AND btrim(message) <> ''
  )
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own contact messages" ON public.contact_messages;
CREATE POLICY "Users read own contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_account());

DROP POLICY IF EXISTS "Admins read contact messages" ON public.contact_messages;
CREATE POLICY "Admins read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.is_admin_account());

GRANT SELECT ON public.contact_messages TO authenticated;

-- ---------------------------------------------------------------------------
-- Return requests
-- ---------------------------------------------------------------------------
CREATE TYPE public.return_request_status AS ENUM (
  'requested',
  'approved',
  'rejected',
  'completed'
);

CREATE TABLE IF NOT EXISTS public.return_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.marketplace_orders (id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status public.return_request_status NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT return_requests_reason_not_empty CHECK (btrim(reason) <> '')
);

CREATE INDEX IF NOT EXISTS return_requests_order_idx ON public.return_requests (order_id);
CREATE INDEX IF NOT EXISTS return_requests_buyer_idx ON public.return_requests (buyer_user_id, created_at DESC);

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own return requests" ON public.return_requests;
CREATE POLICY "Buyers manage own return requests"
ON public.return_requests
FOR SELECT
TO authenticated
USING (buyer_user_id = auth.uid() OR public.is_admin_account());

DROP POLICY IF EXISTS "Buyers insert own return requests" ON public.return_requests;
CREATE POLICY "Buyers insert own return requests"
ON public.return_requests
FOR INSERT
TO authenticated
WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins update return requests" ON public.return_requests;
CREATE POLICY "Admins update return requests"
ON public.return_requests
FOR UPDATE
TO authenticated
USING (public.is_admin_account())
WITH CHECK (public.is_admin_account());

GRANT SELECT, INSERT ON public.return_requests TO authenticated;
GRANT UPDATE ON public.return_requests TO authenticated;

-- ---------------------------------------------------------------------------
-- Route access for public / checkout paths
-- ---------------------------------------------------------------------------
INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/help', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/help/*', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/contact', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/returns', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/track-order', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/cart', ARRAY['buyer'], '/buyer/signin', 50),
  ('/checkout', ARRAY['buyer'], '/buyer/signin', 50),
  ('/checkout/*', ARRAY['buyer'], '/buyer/signin', 50),
  ('/orders', ARRAY['buyer'], '/buyer/signin', 50),
  ('/profile', ARRAY['buyer'], '/buyer/signin', 50),
  ('/notifications', ARRAY['buyer'], '/buyer/signin', 50)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles,
    redirect_path = EXCLUDED.redirect_path,
    priority = EXCLUDED.priority;

-- ---------------------------------------------------------------------------
-- Stock helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_marketplace_order_stock(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.marketplace_order_items
    WHERE order_id = p_order_id
      AND variant_id IS NOT NULL
  LOOP
    UPDATE public.seller_product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_marketplace_order_stock(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT variant_id, quantity
    FROM public.marketplace_order_items
    WHERE order_id = p_order_id
      AND variant_id IS NOT NULL
  LOOP
    UPDATE public.seller_product_variants
    SET stock = stock - v_item.quantity
    WHERE id = v_item.variant_id
      AND stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for variant %.', v_item.variant_id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_delivered_purchases(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer UUID;
BEGIN
  SELECT buyer_user_id INTO v_buyer
  FROM public.marketplace_orders
  WHERE id = p_order_id;

  IF v_buyer IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.buyer_product_purchases (user_id, product_id, purchased_at)
  SELECT v_buyer, moi.product_id, NOW()
  FROM public.marketplace_order_items moi
  WHERE moi.order_id = p_order_id
  ON CONFLICT (user_id, product_id) DO UPDATE
  SET purchased_at = EXCLUDED.purchased_at;
END;
$$;

-- ---------------------------------------------------------------------------
-- Hardened marketplace order creation
-- ---------------------------------------------------------------------------
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
  v_tax_rate NUMERIC(8, 4);
  v_expected_tax NUMERIC(12, 2);
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

  SELECT checkout_tax_rate INTO v_tax_rate
  FROM public.platform_settings
  WHERE id = 1;

  v_expected_tax := ROUND(p_subtotal * COALESCE(v_tax_rate, 0.05), 2);
  v_expected_total := ROUND(
    p_subtotal
    + p_shipping_amount
    + COALESCE(p_cod_charges_amount, 0)
    + v_expected_tax,
    2
  );

  IF ABS(p_tax_amount - v_expected_tax) > 0.02 THEN
    RAISE EXCEPTION 'Tax amount mismatch.';
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
    v_expected_tax,
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

-- ---------------------------------------------------------------------------
-- Payment / seller lifecycle updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_marketplace_stripe_payment(
  p_order_id BIGINT,
  p_stripe_checkout_session_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_amount_minor BIGINT,
  p_currency_code CHAR(3),
  p_raw_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.status = 'pending_seller_acceptance' AND v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'orderNumber', v_order.order_number, 'alreadyConfirmed', true);
  END IF;

  IF v_order.status <> 'awaiting_payment' OR v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not awaiting Stripe payment.';
  END IF;

  IF upper(v_order.currency_code) <> upper(p_currency_code) THEN
    RAISE EXCEPTION 'Stripe currency does not match order currency.';
  END IF;

  PERFORM public.decrement_marketplace_order_stock(p_order_id);

  UPDATE public.marketplace_orders
  SET
    status = 'pending_seller_acceptance',
    payment_status = 'paid',
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  UPDATE public.payment_transactions
  SET
    stripe_payment_intent_id = p_stripe_payment_intent_id,
    amount_minor = p_amount_minor,
    currency_code = upper(p_currency_code),
    status = 'succeeded',
    raw_payload = COALESCE(p_raw_payload, raw_payload),
    updated_at = NOW()
  WHERE stripe_checkout_session_id = p_stripe_checkout_session_id;

  IF NOT FOUND THEN
    INSERT INTO public.payment_transactions (
      order_id,
      provider,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      amount_minor,
      currency_code,
      status,
      raw_payload
    )
    VALUES (
      p_order_id,
      'stripe',
      p_stripe_checkout_session_id,
      p_stripe_payment_intent_id,
      p_amount_minor,
      upper(p_currency_code),
      'succeeded',
      p_raw_payload
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'orderNumber', v_order.order_number,
    'orderId', v_order.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_marketplace_stripe_payment(
  p_order_id BIGINT,
  p_stripe_checkout_session_id TEXT,
  p_raw_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_orders
  SET
    status = 'cancelled',
    payment_status = 'failed',
    updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'awaiting_payment'
    AND payment_status = 'pending';

  UPDATE public.payment_transactions
  SET
    status = 'failed',
    raw_payload = COALESCE(p_raw_payload, raw_payload),
    updated_at = NOW()
  WHERE stripe_checkout_session_id = p_stripe_checkout_session_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.seller_respond_marketplace_order(
  p_order_id BIGINT,
  p_accept BOOLEAN,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
    AND seller_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.status <> 'pending_seller_acceptance' THEN
    RAISE EXCEPTION 'Order is not awaiting seller response.';
  END IF;

  IF NOT p_accept AND v_order.payment_method = 'cod' THEN
    PERFORM public.restore_marketplace_order_stock(p_order_id);
  END IF;

  UPDATE public.marketplace_orders
  SET
    status = CASE WHEN p_accept THEN 'seller_accepted' ELSE 'seller_rejected' END,
    seller_response_note = NULLIF(btrim(p_note), ''),
    seller_responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', CASE WHEN p_accept THEN 'seller_accepted' ELSE 'seller_rejected' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_shipment_tracking(
  p_order_id BIGINT,
  p_tracking_payload JSONB,
  p_mark_shipped BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_order_shipments
  SET
    tracking_payload = p_tracking_payload,
    last_tracked_at = NOW(),
    updated_at = NOW()
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shipment not found.';
  END IF;

  IF p_mark_shipped THEN
    UPDATE public.marketplace_orders
    SET status = 'shipped', updated_at = NOW()
    WHERE id = p_order_id
      AND status IN ('packed', 'shiprocket_created');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_marketplace_order_delivered(p_order_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_orders
  SET status = 'delivered', updated_at = NOW()
  WHERE id = p_order_id
    AND status IN ('shipped', 'packed', 'shiprocket_created');

  IF FOUND THEN
    PERFORM public.record_delivered_purchases(p_order_id);
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_stale_awaiting_payment_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours INT;
  v_order RECORD;
  v_count INT := 0;
BEGIN
  SELECT stale_payment_hours INTO v_hours FROM public.platform_settings WHERE id = 1;

  FOR v_order IN
    SELECT id
    FROM public.marketplace_orders
    WHERE status = 'awaiting_payment'
      AND payment_status = 'pending'
      AND created_at < NOW() - make_interval(hours => COALESCE(v_hours, 24))
  LOOP
    UPDATE public.marketplace_orders
    SET status = 'cancelled', payment_status = 'failed', updated_at = NOW()
    WHERE id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'cancelledCount', v_count);
END;
$$;

-- ---------------------------------------------------------------------------
-- Guest + buyer APIs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_full_name TEXT,
  p_email TEXT,
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
  IF btrim(p_full_name) = '' OR btrim(p_email) = '' OR btrim(p_message) = '' THEN
    RAISE EXCEPTION 'All contact fields are required.';
  END IF;

  INSERT INTO public.contact_messages (user_id, full_name, email, topic_key, message)
  VALUES (auth.uid(), btrim(p_full_name), lower(btrim(p_email)), COALESCE(NULLIF(btrim(p_topic_key), ''), 'buyer_order'), btrim(p_message))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_return_eligibility(
  p_order_number TEXT,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_window INT;
BEGIN
  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE order_number = btrim(p_order_number)
    AND lower(delivery_email) = lower(btrim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'message', 'Order not found for that email.');
  END IF;

  SELECT return_window_days INTO v_window FROM public.platform_settings WHERE id = 1;

  IF v_order.status <> 'delivered' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'message', 'Returns are available after delivery is completed.',
      'orderId', v_order.id,
      'orderStatus', v_order.status
    );
  END IF;

  IF v_order.updated_at < NOW() - make_interval(days => COALESCE(v_window, 14)) THEN
    RETURN jsonb_build_object('eligible', false, 'message', 'Return window has expired.');
  END IF;

  RETURN jsonb_build_object(
    'eligible', true,
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'requiresLogin', auth.uid() IS NULL OR auth.uid() <> v_order.buyer_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_return_request(
  p_order_id BIGINT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_id BIGINT;
  v_check JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_order
  FROM public.marketplace_orders
  WHERE id = p_order_id
    AND buyer_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  v_check := public.check_return_eligibility(v_order.order_number, v_order.delivery_email);
  IF COALESCE((v_check->>'eligible')::BOOLEAN, false) IS NOT TRUE THEN
    RAISE EXCEPTION '%', COALESCE(v_check->>'message', 'Order is not eligible for return.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.return_requests
    WHERE order_id = p_order_id
      AND status IN ('requested', 'approved')
  ) THEN
    RAISE EXCEPTION 'A return request already exists for this order.';
  END IF;

  INSERT INTO public.return_requests (order_id, buyer_user_id, reason)
  VALUES (p_order_id, auth.uid(), btrim(p_reason))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'returnRequestId', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_buyer_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  RETURN jsonb_build_object(
    'profile', (
      SELECT to_jsonb(bp)
      FROM public.buyer_profiles bp
      WHERE bp.user_id = v_user
    ),
    'addresses', COALESCE((
      SELECT jsonb_agg(to_jsonb(ba) ORDER BY ba.is_default DESC, ba.id DESC)
      FROM public.buyer_addresses ba
      WHERE ba.user_id = v_user
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_buyer_profile(
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  INSERT INTO public.buyer_profiles (user_id, full_name, phone, date_of_birth)
  VALUES (v_user, btrim(p_full_name), NULLIF(btrim(p_phone), ''), p_date_of_birth)
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth,
    updated_at = NOW();

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_buyer_address(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id BIGINT;
  v_is_default BOOLEAN := COALESCE((p_payload->>'isDefault')::BOOLEAN, false);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF v_is_default THEN
    UPDATE public.buyer_addresses SET is_default = false WHERE user_id = v_user;
  END IF;

  v_id := NULLIF(p_payload->>'id', '')::BIGINT;

  IF v_id IS NULL THEN
    INSERT INTO public.buyer_addresses (
      user_id, label, full_name, phone, address_line1, address_line2,
      city, state, postcode, country_iso2, is_default
    )
    VALUES (
      v_user,
      COALESCE(NULLIF(btrim(p_payload->>'label'), ''), 'Home'),
      btrim(p_payload->>'fullName'),
      btrim(p_payload->>'phone'),
      btrim(p_payload->>'addressLine1'),
      NULLIF(btrim(p_payload->>'addressLine2'), ''),
      btrim(p_payload->>'city'),
      btrim(p_payload->>'state'),
      btrim(p_payload->>'postcode'),
      upper(btrim(p_payload->>'countryIso2')),
      v_is_default
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.buyer_addresses
    SET
      label = COALESCE(NULLIF(btrim(p_payload->>'label'), ''), label),
      full_name = btrim(p_payload->>'fullName'),
      phone = btrim(p_payload->>'phone'),
      address_line1 = btrim(p_payload->>'addressLine1'),
      address_line2 = NULLIF(btrim(p_payload->>'addressLine2'), ''),
      city = btrim(p_payload->>'city'),
      state = btrim(p_payload->>'state'),
      postcode = btrim(p_payload->>'postcode'),
      country_iso2 = upper(btrim(p_payload->>'countryIso2')),
      is_default = v_is_default,
      updated_at = NOW()
    WHERE id = v_id
      AND user_id = v_user;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Address not found.';
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'addressId', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_buyer_address(p_address_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.buyer_addresses
  WHERE id = p_address_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found.';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_buyers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC)
    FROM (
      SELECT
        bp.user_id,
        bp.full_name,
        bp.phone,
        bp.created_at,
        (
          SELECT COUNT(*)::INT
          FROM public.marketplace_orders mo
          WHERE mo.buyer_user_id = bp.user_id
        ) AS order_count
      FROM public.buyer_profiles bp
      ORDER BY bp.created_at DESC
      LIMIT 500
    ) x
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_sellers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC)
    FROM (
      SELECT
        sa.user_id,
        sa.business_name,
        sa.iso_alpha2,
        COALESCE(k.status, 'not_submitted') AS kyc_status,
        sa.created_at,
        (
          SELECT COUNT(*)::INT
          FROM public.seller_products sp
          WHERE sp.user_id = sa.user_id
            AND sp.approval_status = 'approved'
        ) AS approved_product_count
      FROM public.seller_accounts sa
      LEFT JOIN public.seller_kyc_submissions k ON k.user_id = sa.user_id
      ORDER BY sa.created_at DESC
      LIMIT 500
    ) x
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_support_requests()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t))
    FROM (
      SELECT id, portal_key, user_id, topic_key, message, status, created_at, 'support' AS source
      FROM public.support_requests
      UNION ALL
      SELECT id, 'buyer' AS portal_key, user_id, topic_key, message, status, created_at, 'contact' AS source
      FROM public.contact_messages
      ORDER BY created_at DESC
      LIMIT 500
    ) t
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_return_request(
  p_return_request_id BIGINT,
  p_approve BOOLEAN,
  p_admin_note TEXT DEFAULT NULL
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

  UPDATE public.return_requests
  SET
    status = CASE WHEN p_approve THEN 'approved'::public.return_request_status ELSE 'rejected'::public.return_request_status END,
    admin_note = NULLIF(btrim(p_admin_note), ''),
    updated_at = NOW()
  WHERE id = p_return_request_id
    AND status = 'requested';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request not found or already reviewed.';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_return_eligibility(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_return_request(BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_buyer_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_buyer_profile(TEXT, TEXT, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_buyer_address(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_buyer_address(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_admin_buyers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_admin_sellers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_admin_support_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_return_request(BIGINT, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_stale_awaiting_payment_orders() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_return_eligibility(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_return_request(BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_buyer_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_buyer_profile(TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_buyer_address(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_buyer_address(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_buyers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_sellers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_support_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_return_request(BIGINT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stale_awaiting_payment_orders() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_marketplace_order_delivered(BIGINT) TO service_role;
REVOKE ALL ON FUNCTION public.mark_marketplace_order_delivered(BIGINT) FROM PUBLIC;
