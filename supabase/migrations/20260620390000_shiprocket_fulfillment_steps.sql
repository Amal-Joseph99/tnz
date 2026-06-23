-- Split Shiprocket sync (create order) from AWB assignment; partial document updates.

CREATE OR REPLACE FUNCTION public.admin_record_shiprocket_sync(
  p_order_id BIGINT,
  p_shiprocket_order_id BIGINT,
  p_shiprocket_shipment_id BIGINT
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

  IF p_shiprocket_shipment_id IS NULL OR p_shiprocket_shipment_id <= 0 THEN
    RAISE EXCEPTION 'Shiprocket shipment id is required.';
  END IF;

  UPDATE public.marketplace_orders
  SET status = 'shiprocket_pending', updated_at = NOW()
  WHERE id = p_order_id
    AND status IN ('seller_accepted', 'shiprocket_pending');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order is not ready for Shiprocket sync.';
  END IF;

  INSERT INTO public.marketplace_order_shipments (
    order_id,
    provider,
    shiprocket_order_id,
    shiprocket_shipment_id
  )
  VALUES (
    p_order_id,
    'shiprocket',
    NULLIF(p_shiprocket_order_id, 0),
    p_shiprocket_shipment_id
  )
  ON CONFLICT (order_id) DO UPDATE
  SET
    shiprocket_order_id = COALESCE(EXCLUDED.shiprocket_order_id, marketplace_order_shipments.shiprocket_order_id),
    shiprocket_shipment_id = EXCLUDED.shiprocket_shipment_id,
    updated_at = NOW();

  RETURN jsonb_build_object('ok', true, 'status', 'shiprocket_pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_shipment_documents(
  p_order_id BIGINT,
  p_label_url TEXT DEFAULT NULL,
  p_manifest_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_order_shipments
  SET
    label_url = CASE
      WHEN p_label_url IS NOT NULL THEN NULLIF(btrim(p_label_url), '')
      ELSE label_url
    END,
    manifest_url = CASE
      WHEN p_manifest_url IS NOT NULL THEN NULLIF(btrim(p_manifest_url), '')
      ELSE manifest_url
    END,
    updated_at = NOW()
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shipment not found.';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_shiprocket_sync(BIGINT, BIGINT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_shiprocket_sync(BIGINT, BIGINT, BIGINT) TO service_role;
