-- Razorpay Standard Checkout for marketplace prepaid orders

ALTER TABLE public.payment_transactions
  ALTER COLUMN stripe_checkout_session_id DROP NOT NULL;

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_razorpay_order_uidx
  ON public.payment_transactions (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_razorpay_order(
  p_order_id BIGINT,
  p_razorpay_order_id TEXT,
  p_amount_minor BIGINT,
  p_currency_code CHAR(3)
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
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.status <> 'awaiting_payment' OR v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is not awaiting Razorpay payment.';
  END IF;

  IF upper(v_order.currency_code) <> upper(p_currency_code) THEN
    RAISE EXCEPTION 'Razorpay currency does not match order currency.';
  END IF;

  INSERT INTO public.payment_transactions (
    order_id,
    provider,
    razorpay_order_id,
    amount_minor,
    currency_code,
    status
  )
  VALUES (
    p_order_id,
    'razorpay',
    p_razorpay_order_id,
    p_amount_minor,
    upper(p_currency_code),
    'pending'
  )
  ON CONFLICT (razorpay_order_id) DO UPDATE
  SET
    amount_minor = EXCLUDED.amount_minor,
    currency_code = EXCLUDED.currency_code,
    updated_at = NOW();

  RETURN jsonb_build_object('ok', true);
END;
$$;

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

REVOKE ALL ON FUNCTION public.record_razorpay_order(BIGINT, TEXT, BIGINT, CHAR(3)) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_marketplace_razorpay_payment(BIGINT, TEXT, TEXT, BIGINT, CHAR(3), JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_razorpay_order(BIGINT, TEXT, BIGINT, CHAR(3)) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_marketplace_razorpay_payment(BIGINT, TEXT, TEXT, BIGINT, CHAR(3), JSONB) TO service_role;
