-- Fix seller accept/reject enum cast and allow /seller/orders/:id route access.

INSERT INTO public.app_route_access_rules (path_pattern, allowed_roles, redirect_path, priority)
VALUES
  ('/seller/orders/*', ARRAY['seller'], '/seller/dashboard', 85)
ON CONFLICT (path_pattern) DO UPDATE
SET
  allowed_roles = EXCLUDED.allowed_roles,
  redirect_path = EXCLUDED.redirect_path,
  priority = EXCLUDED.priority;

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
  v_next_status public.marketplace_order_status;
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

  v_next_status := CASE
    WHEN p_accept THEN 'seller_accepted'::public.marketplace_order_status
    ELSE 'seller_rejected'::public.marketplace_order_status
  END;

  UPDATE public.marketplace_orders
  SET
    status = v_next_status,
    seller_response_note = NULLIF(btrim(p_note), ''),
    seller_responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', v_next_status::TEXT
  );
END;
$$;

REVOKE ALL ON FUNCTION public.seller_respond_marketplace_order(BIGINT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seller_respond_marketplace_order(BIGINT, BOOLEAN, TEXT) TO authenticated;
