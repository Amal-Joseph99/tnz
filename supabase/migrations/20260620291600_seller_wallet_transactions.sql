-- Seller wallet transactions + summary/list RPCs

CREATE TABLE IF NOT EXISTS public.seller_wallet_transactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES public.marketplace_orders (id) ON DELETE CASCADE,
  order_item_id BIGINT NOT NULL REFERENCES public.marketplace_order_items (id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  gross_amount NUMERIC(12, 2) NOT NULL CHECK (gross_amount >= 0),
  line_amount NUMERIC(12, 2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  wallet_status TEXT NOT NULL DEFAULT 'unsettled'
    CHECK (wallet_status IN ('unsettled', 'pending_settlement', 'available', 'withdrawn', 'cancelled')),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  available_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seller_wallet_transactions_order_item_unique UNIQUE (order_item_id)
);

CREATE INDEX IF NOT EXISTS seller_wallet_transactions_seller_date_idx
  ON public.seller_wallet_transactions (seller_user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS seller_wallet_transactions_order_idx
  ON public.seller_wallet_transactions (order_id);

ALTER TABLE public.seller_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers read own wallet transactions" ON public.seller_wallet_transactions;
CREATE POLICY "Sellers read own wallet transactions"
ON public.seller_wallet_transactions
FOR SELECT
TO authenticated
USING (seller_user_id = auth.uid() OR public.is_admin_account());

GRANT SELECT ON public.seller_wallet_transactions TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_seller_wallet_status_for_order(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_ledger_status TEXT;
  v_available_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.status IN ('cancelled', 'seller_rejected') THEN
    UPDATE public.seller_wallet_transactions
    SET wallet_status = 'cancelled', updated_at = NOW()
    WHERE order_id = p_order_id;
    RETURN;
  END IF;

  IF v_order.status <> 'delivered' THEN
    UPDATE public.seller_wallet_transactions
    SET wallet_status = 'unsettled', updated_at = NOW()
    WHERE order_id = p_order_id;
    RETURN;
  END IF;

  SELECT status, available_at
  INTO v_ledger_status, v_available_at
  FROM public.seller_ledger_entries
  WHERE order_id = p_order_id
    AND entry_type = 'sale_credit'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_ledger_status = 'available' THEN
    UPDATE public.seller_wallet_transactions
    SET
      wallet_status = 'available',
      available_at = COALESCE(v_available_at, available_at),
      updated_at = NOW()
    WHERE order_id = p_order_id;
  ELSIF v_ledger_status = 'pending' THEN
    UPDATE public.seller_wallet_transactions
    SET
      wallet_status = 'pending_settlement',
      available_at = COALESCE(v_available_at, available_at),
      updated_at = NOW()
    WHERE order_id = p_order_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_seller_wallet_transactions_for_order(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.marketplace_orders%ROWTYPE;
  v_commission NUMERIC(5, 2);
  v_item RECORD;
  v_net NUMERIC(12, 2);
BEGIN
  SELECT * INTO v_order FROM public.marketplace_orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_order.status = 'awaiting_payment'
    OR (v_order.payment_method = 'prepaid' AND COALESCE(v_order.payment_status::TEXT, 'pending') <> 'paid') THEN
    RETURN;
  END IF;

  SELECT commission_percent INTO v_commission
  FROM public.platform_settings
  WHERE id = 1;

  FOR v_item IN
    SELECT oi.*
    FROM public.marketplace_order_items oi
    WHERE oi.order_id = p_order_id
  LOOP
    v_net := ROUND(
      v_item.line_total - (v_item.line_total * COALESCE(v_commission, 12) / 100),
      2
    );

    INSERT INTO public.seller_wallet_transactions (
      seller_user_id,
      order_id,
      order_item_id,
      order_number,
      product_name,
      sku,
      buyer_name,
      quantity,
      unit_price,
      gross_amount,
      line_amount,
      currency_code,
      transaction_date
    )
    VALUES (
      v_order.seller_user_id,
      p_order_id,
      v_item.id,
      v_order.order_number,
      v_item.product_name,
      v_item.sku,
      v_order.delivery_full_name,
      v_item.quantity,
      v_item.unit_price,
      v_item.line_total,
      v_net,
      v_order.currency_code,
      v_order.created_at
    )
    ON CONFLICT (order_item_id) DO UPDATE
    SET
      order_number = EXCLUDED.order_number,
      product_name = EXCLUDED.product_name,
      sku = EXCLUDED.sku,
      buyer_name = EXCLUDED.buyer_name,
      quantity = EXCLUDED.quantity,
      unit_price = EXCLUDED.unit_price,
      gross_amount = EXCLUDED.gross_amount,
      line_amount = EXCLUDED.line_amount,
      currency_code = EXCLUDED.currency_code,
      updated_at = NOW();
  END LOOP;

  PERFORM public.refresh_seller_wallet_status_for_order(p_order_id);
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
    PERFORM public.refresh_seller_wallet_status_for_order(p_order_id);
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

  PERFORM public.sync_seller_wallet_transactions_for_order(p_order_id);
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
  v_order_id BIGINT;
BEGIN
  UPDATE public.seller_ledger_entries
  SET status = 'available'
  WHERE status = 'pending'
    AND available_at IS NOT NULL
    AND available_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  FOR v_order_id IN
    SELECT DISTINCT order_id
    FROM public.seller_ledger_entries
    WHERE status = 'available'
      AND order_id IS NOT NULL
  LOOP
    PERFORM public.refresh_seller_wallet_status_for_order(v_order_id);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'releasedCount', v_count);
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
  FROM public.seller_accounts sa
  WHERE sa.user_id = v_seller;

  RETURN jsonb_build_object(
    'currencyCode', v_currency,
    'unsettledBalance', COALESCE((
      SELECT SUM(line_amount)
      FROM public.seller_wallet_transactions
      WHERE seller_user_id = v_seller
        AND wallet_status = 'unsettled'
    ), 0),
    'availableToWithdraw', COALESCE((
      SELECT SUM(amount)
      FROM public.seller_ledger_entries
      WHERE seller_user_id = v_seller
        AND status = 'available'
    ), 0),
    'totalSalesAmount', COALESCE((
      SELECT SUM(gross_amount)
      FROM public.seller_wallet_transactions
      WHERE seller_user_id = v_seller
        AND wallet_status <> 'cancelled'
    ), 0),
    'totalWithdrawnAmount', COALESCE((
      SELECT ABS(SUM(amount))
      FROM public.seller_ledger_entries
      WHERE seller_user_id = v_seller
        AND entry_type = 'payout_debit'
    ), 0),
    'pendingSettlement', COALESCE((
      SELECT SUM(line_amount)
      FROM public.seller_wallet_transactions
      WHERE seller_user_id = v_seller
        AND wallet_status = 'pending_settlement'
    ), 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_seller_wallet_transactions(p_limit INT DEFAULT 100)
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
    SELECT jsonb_agg(row_to_json(t) ORDER BY t.transaction_date DESC, t.id DESC)
    FROM (
      SELECT
        id,
        transaction_date,
        order_id,
        order_number,
        product_name,
        sku,
        buyer_name,
        quantity,
        unit_price,
        gross_amount,
        line_amount,
        currency_code,
        wallet_status
      FROM public.seller_wallet_transactions
      WHERE seller_user_id = auth.uid()
      ORDER BY transaction_date DESC, id DESC
      LIMIT GREATEST(1, LEAST(p_limit, 500))
    ) t
  ), '[]'::jsonb);
END;
$$;

-- Backfill existing paid / COD orders
DO $$
DECLARE
  v_order_id BIGINT;
BEGIN
  FOR v_order_id IN
    SELECT o.id
    FROM public.marketplace_orders o
    WHERE o.status NOT IN ('awaiting_payment', 'cancelled', 'seller_rejected')
      AND (
        o.payment_method = 'cod'
        OR COALESCE(o.payment_status::TEXT, '') = 'paid'
      )
  LOOP
    PERFORM public.sync_seller_wallet_transactions_for_order(v_order_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_seller_wallet_transactions_for_order(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_seller_wallet_status_for_order(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_seller_wallet_transactions(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_seller_wallet_transactions(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_sync_seller_wallet_after_order_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_seller_wallet_transactions_for_order(NEW.order_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_seller_wallet_after_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    PERFORM public.sync_seller_wallet_transactions_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_wallet_sync_order_item ON public.marketplace_order_items;
CREATE TRIGGER seller_wallet_sync_order_item
AFTER INSERT ON public.marketplace_order_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_seller_wallet_after_order_item();

DROP TRIGGER IF EXISTS seller_wallet_sync_order_update ON public.marketplace_orders;
CREATE TRIGGER seller_wallet_sync_order_update
AFTER UPDATE OF status, payment_status ON public.marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_seller_wallet_after_order_update();
