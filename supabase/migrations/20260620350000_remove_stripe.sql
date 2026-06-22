-- Remove Stripe; Razorpay is the sole prepaid payment provider.

ALTER TABLE public.return_requests
  RENAME COLUMN stripe_refund_status TO payment_refund_status;

ALTER TABLE public.return_requests
  RENAME COLUMN stripe_refund_id TO payment_refund_id;

ALTER TABLE public.payment_transactions
  DROP COLUMN IF EXISTS stripe_checkout_session_id,
  DROP COLUMN IF EXISTS stripe_payment_intent_id;

ALTER TABLE public.payment_transactions
  ALTER COLUMN provider SET DEFAULT 'razorpay';

DROP FUNCTION IF EXISTS public.record_stripe_checkout_session(BIGINT, TEXT, BIGINT, CHAR(3));
DROP FUNCTION IF EXISTS public.confirm_marketplace_stripe_payment(BIGINT, TEXT, TEXT, BIGINT, CHAR(3), JSONB);
DROP FUNCTION IF EXISTS public.fail_marketplace_stripe_payment(BIGINT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.complete_return_stripe_refund(BIGINT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.confirm_marketplace_razorpay_payment(
  p_order_id BIGINT,
  p_razorpay_order_id TEXT,
  p_razorpay_payment_id TEXT,
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
    RAISE EXCEPTION 'Order is not awaiting Razorpay payment.';
  END IF;

  IF upper(v_order.currency_code) <> upper(p_currency_code) THEN
    RAISE EXCEPTION 'Razorpay currency does not match order currency.';
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
    razorpay_payment_id = p_razorpay_payment_id,
    amount_minor = p_amount_minor,
    currency_code = upper(p_currency_code),
    status = 'succeeded',
    raw_payload = COALESCE(p_raw_payload, raw_payload),
    updated_at = NOW()
  WHERE razorpay_order_id = p_razorpay_order_id;

  IF NOT FOUND THEN
    INSERT INTO public.payment_transactions (
      order_id,
      provider,
      razorpay_order_id,
      razorpay_payment_id,
      amount_minor,
      currency_code,
      status,
      raw_payload
    )
    VALUES (
      p_order_id,
      'razorpay',
      p_razorpay_order_id,
      p_razorpay_payment_id,
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

CREATE OR REPLACE FUNCTION public.list_admin_return_requests()
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
    SELECT jsonb_agg(row_to_json(r) ORDER BY r.created_at DESC)
    FROM (
      SELECT
        rr.id,
        rr.order_id,
        rr.buyer_user_id,
        rr.reason,
        rr.status,
        rr.admin_note,
        rr.payment_refund_status,
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
  v_payment_id TEXT;
  v_amount_minor BIGINT;
BEGIN
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  SELECT * INTO v_rr FROM public.return_requests WHERE id = p_return_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request not found.';
  END IF;

  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_rr.order_id;

  SELECT pt.razorpay_payment_id, pt.amount_minor
  INTO v_payment_id, v_amount_minor
  FROM public.payment_transactions pt
  WHERE pt.order_id = v_rr.order_id
    AND pt.status = 'succeeded'
    AND pt.provider = 'razorpay'
  ORDER BY pt.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'returnRequestId', v_rr.id,
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'totalAmount', v_order.total_amount,
    'currencyCode', v_order.currency_code,
    'paymentMethod', v_order.payment_method,
    'razorpayPaymentId', v_payment_id,
    'amountMinor', v_amount_minor,
    'paymentRefundStatus', v_rr.payment_refund_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_return_payment_refund(
  p_return_request_id BIGINT,
  p_refund_id TEXT,
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request not found.';
  END IF;

  UPDATE public.return_requests
  SET
    payment_refund_status = CASE WHEN p_success THEN 'succeeded' ELSE 'failed' END,
    payment_refund_id = NULLIF(btrim(p_refund_id), ''),
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
  IF NOT public.is_admin_account() THEN
    RAISE EXCEPTION 'Admin access required.';
  END IF;

  SELECT * INTO v_rr FROM public.return_requests WHERE id = p_return_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Return request not found.';
  END IF;
  IF v_rr.status <> 'requested' THEN
    RAISE EXCEPTION 'Return request already reviewed.';
  END IF;

  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = v_rr.order_id;

  UPDATE public.return_requests
  SET
    status = CASE WHEN p_approve THEN 'approved'::public.return_request_status ELSE 'rejected'::public.return_request_status END,
    admin_note = NULLIF(btrim(p_admin_note), ''),
    payment_refund_status = CASE
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
    'needsPaymentRefund', p_approve AND v_order.payment_method = 'prepaid'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_return_payment_refund(BIGINT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_return_payment_refund(BIGINT, TEXT, BOOLEAN) TO service_role;
