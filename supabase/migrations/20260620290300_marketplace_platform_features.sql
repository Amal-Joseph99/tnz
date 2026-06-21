-- Wallet, notifications, newsletter, platform settings extensions, settlement + refund hooks

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 12.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  ADD COLUMN IF NOT EXISTS settlement_days INT NOT NULL DEFAULT 7 CHECK (settlement_days > 0),
  ADD COLUMN IF NOT EXISTS ops_email TEXT,
  ADD COLUMN IF NOT EXISTS notify_kyc_submissions BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_order_disputes BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_seller_kyc_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS require_product_approval BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('buyer', 'seller', 'admin')),
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_path TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_notifications_title_not_empty CHECK (btrim(title) <> '')
);

CREATE INDEX IF NOT EXISTS app_notifications_user_created_idx
  ON public.app_notifications (user_id, is_read, created_at DESC);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.app_notifications;
CREATE POLICY "Users read own notifications"
ON public.app_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.app_notifications;
CREATE POLICY "Users update own notifications"
ON public.app_notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

GRANT SELECT, UPDATE ON public.app_notifications TO authenticated;

-- ---------------------------------------------------------------------------
-- Seller wallet / ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_ledger_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES public.marketplace_orders (id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale_credit', 'commission_debit', 'payout_debit', 'adjustment')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount <> 0),
  currency_code CHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  available_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_ledger_seller_idx
  ON public.seller_ledger_entries (seller_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.seller_payout_batches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency_code CHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'paid', 'failed')),
  reference_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS seller_payout_batches_seller_idx
  ON public.seller_payout_batches (seller_user_id, created_at DESC);

ALTER TABLE public.seller_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payout_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers read own ledger" ON public.seller_ledger_entries;
CREATE POLICY "Sellers read own ledger"
ON public.seller_ledger_entries FOR SELECT TO authenticated
USING (seller_user_id = auth.uid() OR public.is_admin_account());

DROP POLICY IF EXISTS "Sellers read own payouts" ON public.seller_payout_batches;
CREATE POLICY "Sellers read own payouts"
ON public.seller_payout_batches FOR SELECT TO authenticated
USING (seller_user_id = auth.uid() OR public.is_admin_account());

GRANT SELECT ON public.seller_ledger_entries TO authenticated;
GRANT SELECT ON public.seller_payout_batches TO authenticated;

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT TO authenticated
USING (public.is_admin_account());

-- ---------------------------------------------------------------------------
-- Return refund tracking
-- ---------------------------------------------------------------------------
ALTER TABLE public.return_requests
  ADD COLUMN IF NOT EXISTS stripe_refund_status TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (stripe_refund_status IN ('not_applicable', 'pending', 'succeeded', 'failed')),
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_app_notification(
  p_user_id UUID,
  p_audience TEXT,
  p_category TEXT,
  p_title TEXT,
  p_body TEXT,
  p_link_path TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.app_notifications (user_id, audience, category, title, body, link_path)
  VALUES (p_user_id, p_audience, p_category, btrim(p_title), btrim(p_body), p_link_path);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_category TEXT,
  p_title TEXT,
  p_body TEXT,
  p_link_path TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
BEGIN
  FOR v_admin IN SELECT user_id FROM public.staff_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_app_notification(v_admin, 'admin', p_category, p_title, p_body, p_link_path);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_delivered_order_wallet(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_commission NUMERIC(5, 2);
  v_settlement_days INT;
  v_gross NUMERIC(12, 2);
  v_fee NUMERIC(12, 2);
  v_net NUMERIC(12, 2);
  v_available_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND OR v_order.status <> 'delivered' THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM public.seller_ledger_entries
    WHERE order_id = p_order_id AND entry_type = 'sale_credit'
  ) THEN
    RETURN;
  END IF;

  SELECT commission_percent, settlement_days
  INTO v_commission, v_settlement_days
  FROM public.platform_settings WHERE id = 1;

  v_gross := v_order.subtotal_amount;
  v_fee := ROUND(v_gross * COALESCE(v_commission, 12) / 100, 2);
  v_net := v_gross - v_fee;
  v_available_at := NOW() + make_interval(days => COALESCE(v_settlement_days, 7));

  INSERT INTO public.seller_ledger_entries (
    seller_user_id, order_id, entry_type, amount, currency_code, status, available_at, description
  ) VALUES (
    v_order.seller_user_id, p_order_id, 'sale_credit', v_net, v_order.currency_code,
    'pending', v_available_at, 'Order ' || v_order.order_number || ' settlement'
  );

  IF v_fee > 0 THEN
    INSERT INTO public.seller_ledger_entries (
      seller_user_id, order_id, entry_type, amount, currency_code, status, available_at, description
    ) VALUES (
      v_order.seller_user_id, p_order_id, 'commission_debit', -v_fee, v_order.currency_code,
      'pending', v_available_at, 'Marketplace commission'
    );
  END IF;
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
    PERFORM public.settle_delivered_order_wallet(p_order_id);
    PERFORM public.create_app_notification(
      (SELECT buyer_user_id FROM public.marketplace_orders WHERE id = p_order_id),
      'buyer', 'order', 'Order delivered', 'Your order has been delivered.', '/orders'
    );
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_pending_seller_balances()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE public.seller_ledger_entries
  SET status = 'available'
  WHERE status = 'pending'
    AND available_at IS NOT NULL
    AND available_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'releasedCount', v_count);
END;
$$;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_user_notifications(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required.'; END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(n) ORDER BY n.created_at DESC)
    FROM (
      SELECT id, audience, category, title, body, link_path, is_read, created_at
      FROM public.app_notifications
      WHERE user_id = auth.uid()
      ORDER BY created_at DESC
      LIMIT GREATEST(1, LEAST(p_limit, 200))
    ) n
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids BIGINT[] DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required.'; END IF;

  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    UPDATE public.app_notifications SET is_read = true WHERE user_id = auth.uid() AND is_read = false;
  ELSE
    UPDATE public.app_notifications SET is_read = true
    WHERE user_id = auth.uid() AND id = ANY(p_notification_ids);
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_seller_wallet_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller UUID := auth.uid();
  v_currency CHAR(3) := 'USD';
BEGIN
  IF v_seller IS NULL THEN RAISE EXCEPTION 'Authentication required.'; END IF;
  IF NOT public.is_seller_account() THEN RAISE EXCEPTION 'Seller access required.'; END IF;

  SELECT COALESCE(sa.base_currency_code, 'USD') INTO v_currency
  FROM public.seller_accounts sa WHERE sa.user_id = v_seller;

  RETURN jsonb_build_object(
    'currencyCode', v_currency,
    'availableBalance', COALESCE((
      SELECT SUM(amount) FROM public.seller_ledger_entries
      WHERE seller_user_id = v_seller AND status = 'available'
    ), 0),
    'pendingBalance', COALESCE((
      SELECT SUM(amount) FROM public.seller_ledger_entries
      WHERE seller_user_id = v_seller AND status = 'pending'
    ), 0),
    'totalFees', COALESCE((
      SELECT ABS(SUM(amount)) FROM public.seller_ledger_entries
      WHERE seller_user_id = v_seller AND entry_type = 'commission_debit'
    ), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_seller_ledger_entries(p_limit INT DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_seller_account() THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(e) ORDER BY e.created_at DESC)
    FROM (
      SELECT id, entry_type, amount, currency_code, status, available_at, description, created_at, order_id
      FROM public.seller_ledger_entries
      WHERE seller_user_id = auth.uid()
      ORDER BY created_at DESC
      LIMIT GREATEST(1, LEAST(p_limit, 200))
    ) e
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.request_seller_payout(p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller UUID := auth.uid();
  v_available NUMERIC(12, 2);
  v_currency CHAR(3);
  v_id BIGINT;
BEGIN
  IF v_seller IS NULL OR NOT public.is_seller_account() THEN
    RAISE EXCEPTION 'Seller access required.';
  END IF;

  IF p_amount <= 0 THEN RAISE EXCEPTION 'Payout amount must be positive.'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_available
  FROM public.seller_ledger_entries
  WHERE seller_user_id = v_seller AND status = 'available';

  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Insufficient available balance.';
  END IF;

  SELECT COALESCE(sa.base_currency_code, 'USD') INTO v_currency
  FROM public.seller_accounts sa WHERE sa.user_id = v_seller;

  INSERT INTO public.seller_payout_batches (seller_user_id, amount, currency_code)
  VALUES (v_seller, p_amount, v_currency)
  RETURNING id INTO v_id;

  INSERT INTO public.seller_ledger_entries (
    seller_user_id, entry_type, amount, currency_code, status, description
  ) VALUES (
    v_seller, 'payout_debit', -p_amount, v_currency, 'paid', 'Payout batch #' || v_id
  );

  PERFORM public.notify_all_admins(
    'payout', 'Seller payout requested',
    'A seller requested a payout of ' || p_amount::TEXT || ' ' || v_currency,
    '/admin/notifications'
  );

  RETURN jsonb_build_object('ok', true, 'payoutBatchId', v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF btrim(p_email) = '' THEN RAISE EXCEPTION 'Email is required.'; END IF;

  INSERT INTO public.newsletter_subscribers (email, user_id)
  VALUES (lower(btrim(p_email)), auth.uid())
  ON CONFLICT (email) DO UPDATE
  SET is_active = true, user_id = COALESCE(EXCLUDED.user_id, newsletter_subscribers.user_id);

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_platform_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN RAISE EXCEPTION 'Admin access required.'; END IF;
  RETURN (SELECT to_jsonb(ps) FROM public.platform_settings ps WHERE id = 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_platform_settings(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN RAISE EXCEPTION 'Admin access required.'; END IF;

  UPDATE public.platform_settings
  SET
    checkout_tax_rate = COALESCE((p_payload->>'checkout_tax_rate')::NUMERIC, checkout_tax_rate),
    return_window_days = COALESCE((p_payload->>'return_window_days')::INT, return_window_days),
    stale_payment_hours = COALESCE((p_payload->>'stale_payment_hours')::INT, stale_payment_hours),
    commission_percent = COALESCE((p_payload->>'commission_percent')::NUMERIC, commission_percent),
    settlement_days = COALESCE((p_payload->>'settlement_days')::INT, settlement_days),
    ops_email = COALESCE(NULLIF(btrim(p_payload->>'ops_email'), ''), ops_email),
    notify_kyc_submissions = COALESCE((p_payload->>'notify_kyc_submissions')::BOOLEAN, notify_kyc_submissions),
    notify_order_disputes = COALESCE((p_payload->>'notify_order_disputes')::BOOLEAN, notify_order_disputes),
    require_seller_kyc_approval = COALESCE((p_payload->>'require_seller_kyc_approval')::BOOLEAN, require_seller_kyc_approval),
    require_product_approval = COALESCE((p_payload->>'require_product_approval')::BOOLEAN, require_product_approval),
    updated_at = NOW()
  WHERE id = 1;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_return_requests()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_account() THEN RAISE EXCEPTION 'Admin access required.'; END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(r) ORDER BY r.created_at DESC)
    FROM (
      SELECT
        rr.id,
        rr.order_id,
        rr.buyer_user_id,
        rr.reason,
        rr.status,
        rr.admin_note,
        rr.stripe_refund_status,
        rr.created_at,
        mo.order_number,
        mo.total_amount,
        mo.currency_code,
        mo.payment_method
      FROM public.return_requests rr
      JOIN public.marketplace_orders mo ON mo.id = rr.order_id
      ORDER BY rr.created_at DESC
      LIMIT 200
    ) r
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_return_refund_context(p_return_request_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rr public.return_requests%ROWTYPE;
  v_order public.marketplace_orders%ROWTYPE;
  v_payment_intent TEXT;
BEGIN
  IF NOT public.is_admin_account() THEN RAISE EXCEPTION 'Admin access required.'; END IF;

  SELECT * INTO v_rr FROM public.return_requests WHERE id = p_return_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Return request not found.'; END IF;

  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_rr.order_id;

  SELECT pt.stripe_payment_intent_id INTO v_payment_intent
  FROM public.payment_transactions pt
  WHERE pt.order_id = v_rr.order_id AND pt.status = 'succeeded'
  ORDER BY pt.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'returnRequestId', v_rr.id,
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'totalAmount', v_order.total_amount,
    'currencyCode', v_order.currency_code,
    'paymentMethod', v_order.payment_method,
    'stripePaymentIntentId', v_payment_intent,
    'stripeRefundStatus', v_rr.stripe_refund_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_return_stripe_refund(
  p_return_request_id BIGINT,
  p_stripe_refund_id TEXT,
  p_success BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rr public.return_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_rr FROM public.return_requests WHERE id = p_return_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Return request not found.'; END IF;

  UPDATE public.return_requests
  SET
    stripe_refund_status = CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    stripe_refund_id = NULLIF(btrim(p_stripe_refund_id), ''),
    status = CASE WHEN p_success THEN 'completed'::public.return_request_status ELSE status END,
    updated_at = NOW()
  WHERE id = p_return_request_id;

  IF p_success THEN
    UPDATE public.marketplace_orders
    SET payment_status = 'refunded', updated_at = NOW()
    WHERE id = v_rr.order_id;

    PERFORM public.create_app_notification(
      v_rr.buyer_user_id, 'buyer', 'refund',
      'Refund processed', 'Your return refund has been processed.', '/orders'
    );
  END IF;

  RETURN jsonb_build_object('ok', true);
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
DECLARE
  v_rr public.return_requests%ROWTYPE;
  v_order public.marketplace_orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin_account() THEN RAISE EXCEPTION 'Admin access required.'; END IF;

  SELECT * INTO v_rr FROM public.return_requests WHERE id = p_return_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Return request not found.'; END IF;
  IF v_rr.status <> 'requested' THEN RAISE EXCEPTION 'Return request already reviewed.'; END IF;

  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_rr.order_id;

  UPDATE public.return_requests
  SET
    status = CASE WHEN p_approve THEN 'approved'::public.return_request_status ELSE 'rejected'::public.return_request_status END,
    admin_note = NULLIF(btrim(p_admin_note), ''),
    stripe_refund_status = CASE
      WHEN NOT p_approve THEN 'not_applicable'
      WHEN v_order.payment_method = 'prepaid' THEN 'pending'
      ELSE 'not_applicable'
    END,
    updated_at = NOW()
  WHERE id = p_return_request_id;

  PERFORM public.create_app_notification(
    v_rr.buyer_user_id, 'buyer', 'return',
    CASE WHEN p_approve THEN 'Return approved' ELSE 'Return rejected' END,
    CASE WHEN p_approve THEN 'Your return request was approved.' ELSE 'Your return request was rejected.' END,
    '/returns'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'needsStripeRefund', p_approve AND v_order.payment_method = 'prepaid'
  );
END;
$$;

-- Patch order lifecycle notifications
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
  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found.'; END IF;

  IF v_order.status = 'pending_seller_acceptance' AND v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'orderNumber', v_order.order_number, 'alreadyConfirmed', true);
  END IF;

  IF v_order.status <> 'awaiting_payment' OR v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not awaiting Stripe payment.';
  END IF;

  PERFORM public.decrement_marketplace_order_stock(p_order_id);

  UPDATE public.marketplace_orders
  SET status = 'pending_seller_acceptance', payment_status = 'paid', paid_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  UPDATE public.payment_transactions
  SET stripe_payment_intent_id = p_stripe_payment_intent_id, amount_minor = p_amount_minor,
      currency_code = upper(p_currency_code), status = 'succeeded',
      raw_payload = COALESCE(p_raw_payload, raw_payload), updated_at = NOW()
  WHERE stripe_checkout_session_id = p_stripe_checkout_session_id;

  IF NOT FOUND THEN
    INSERT INTO public.payment_transactions (
      order_id, provider, stripe_checkout_session_id, stripe_payment_intent_id,
      amount_minor, currency_code, status, raw_payload
    ) VALUES (
      p_order_id, 'stripe', p_stripe_checkout_session_id, p_stripe_payment_intent_id,
      p_amount_minor, upper(p_currency_code), 'succeeded', p_raw_payload
    );
  END IF;

  PERFORM public.create_app_notification(
    v_order.buyer_user_id, 'buyer', 'order',
    'Payment received', 'Your payment for ' || v_order.order_number || ' was successful.', '/orders'
  );
  PERFORM public.create_app_notification(
    v_order.seller_user_id, 'seller', 'order',
    'New order', 'Order ' || v_order.order_number || ' is awaiting your acceptance.', '/seller/orders'
  );

  RETURN jsonb_build_object('ok', true, 'orderNumber', v_order.order_number, 'orderId', v_order.id);
END;
$$;

-- Route access for legal pages
INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/shipping-policy', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/refund-policy', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/seller-agreement', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/buyer-protection', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/payment-terms', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/disclaimer', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/accessibility', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/legal/*', ARRAY['guest', 'buyer', 'seller', 'admin'], NULL, 50),
  ('/admin/support', ARRAY['admin'], '/admin/dashboard', 90),
  ('/admin/returns', ARRAY['admin'], '/admin/dashboard', 90)
ON CONFLICT (path_pattern) DO UPDATE
SET allowed_roles = EXCLUDED.allowed_roles, redirect_path = EXCLUDED.redirect_path, priority = EXCLUDED.priority;

REVOKE ALL ON FUNCTION public.create_app_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_all_admins(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_delivered_order_wallet(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_pending_seller_balances() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_user_notifications(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notifications_read(BIGINT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_seller_wallet_summary() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_seller_ledger_entries(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_seller_payout(NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.subscribe_newsletter(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_platform_settings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_admin_platform_settings(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_admin_return_requests() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_return_refund_context(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_return_stripe_refund(BIGINT, TEXT, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_user_notifications(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_wallet_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_seller_ledger_entries(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_seller_payout(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_platform_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_platform_settings(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_return_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_return_refund_context(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_return_stripe_refund(BIGINT, TEXT, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_pending_seller_balances() TO service_role;
