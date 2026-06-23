-- record_razorpay_order used ON CONFLICT (razorpay_order_id) but only a partial
-- unique index existed, which PostgreSQL cannot infer for upsert.

DROP INDEX IF EXISTS public.payment_transactions_razorpay_order_uidx;

CREATE UNIQUE INDEX payment_transactions_razorpay_order_uidx
  ON public.payment_transactions (razorpay_order_id);

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

REVOKE ALL ON FUNCTION public.record_razorpay_order(BIGINT, TEXT, BIGINT, CHAR(3)) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_razorpay_order(BIGINT, TEXT, BIGINT, CHAR(3)) TO service_role;
