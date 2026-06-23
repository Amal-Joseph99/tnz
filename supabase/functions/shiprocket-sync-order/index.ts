import {
  assertAdmin,
  buildShiprocketCreateOrderPayload,
  corsHeaders,
  createAuthedSupabase,
  extractShiprocketIds,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type SyncOrderRequest = {
  orderId: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    await assertAdmin(serviceClient, user.id)

    const body = await req.json() as SyncOrderRequest
    if (!body.orderId) return jsonResponse({ error: 'orderId is required.' }, 400)

    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (*),
        marketplace_order_shipments (shiprocket_order_id, shiprocket_shipment_id, awb_code)
      `)
      .eq('id', body.orderId)
      .maybeSingle()

    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404)
    if (order.status !== 'seller_accepted' && order.status !== 'shiprocket_pending') {
      return jsonResponse({ error: 'Order must be seller-accepted before Shiprocket sync.' }, 400)
    }

    const existingShipment = Array.isArray(order.marketplace_order_shipments)
      ? order.marketplace_order_shipments[0]
      : order.marketplace_order_shipments

    if (existingShipment?.shiprocket_shipment_id && !existingShipment.awb_code) {
      return jsonResponse({
        ok: true,
        shiprocketOrderId: existingShipment.shiprocket_order_id,
        shiprocketShipmentId: existingShipment.shiprocket_shipment_id,
        alreadySynced: true,
      })
    }

    if (existingShipment?.awb_code) {
      return jsonResponse({ error: 'Shipment already created on Shiprocket.' }, 400)
    }

    const { data: warehouse, error: warehouseError } = await serviceClient
      .from('seller_warehouses')
      .select('shiprocket_pickup_location_name')
      .eq('user_id', order.seller_user_id)
      .maybeSingle()

    if (warehouseError) return jsonResponse({ error: warehouseError.message }, 500)
    if (!warehouse?.shiprocket_pickup_location_name) {
      return jsonResponse({ error: 'Seller Shiprocket pickup location name is not configured.' }, 400)
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)
    const createPayload = await buildShiprocketCreateOrderPayload(
      serviceClient,
      order,
      warehouse.shiprocket_pickup_location_name,
      settings,
    )

    const created = await shiprocketRequest(settings, token, settings.create_order_path, {
      method: 'POST',
      body: JSON.stringify(createPayload),
    })

    const { shiprocketOrderId, shiprocketShipmentId } = extractShiprocketIds(created as Record<string, unknown>)
    if (!shiprocketShipmentId) {
      return jsonResponse({ error: 'Shiprocket order created but shipment id was missing.' }, 502)
    }

    const { error: syncError } = await serviceClient.rpc('admin_record_shiprocket_sync', {
      p_order_id: body.orderId,
      p_shiprocket_order_id: shiprocketOrderId || null,
      p_shiprocket_shipment_id: shiprocketShipmentId,
    })

    if (syncError) return jsonResponse({ error: syncError.message }, 500)

    return jsonResponse({
      ok: true,
      shiprocketOrderId,
      shiprocketShipmentId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required.' ? 403 : 500
    return jsonResponse({ error: message }, status)
  }
})
