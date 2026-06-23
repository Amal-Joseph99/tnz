import {
  assertAdmin,
  corsHeaders,
  createAuthedSupabase,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type AssignShipmentRequest = {
  orderId: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    await assertAdmin(serviceClient, user.id)

    const body = await req.json() as AssignShipmentRequest
    if (!body.orderId) return jsonResponse({ error: 'orderId is required.' }, 400)

    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select(`
        id,
        status,
        shipping_courier_company_id,
        shipping_courier_name,
        marketplace_order_shipments (shiprocket_order_id, shiprocket_shipment_id, awb_code)
      `)
      .eq('id', body.orderId)
      .maybeSingle()

    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404)
    if (order.status !== 'shiprocket_pending') {
      return jsonResponse({ error: 'Order must be synced to Shiprocket before creating shipment.' }, 400)
    }

    const shipment = Array.isArray(order.marketplace_order_shipments)
      ? order.marketplace_order_shipments[0]
      : order.marketplace_order_shipments

    if (!shipment?.shiprocket_shipment_id) {
      return jsonResponse({ error: 'Sync the order to Shiprocket first.' }, 400)
    }

    if (shipment.awb_code) {
      return jsonResponse({
        ok: true,
        awbCode: shipment.awb_code,
        alreadyAssigned: true,
      })
    }

    if (!order.shipping_courier_company_id) {
      return jsonResponse({ error: 'Buyer courier partner is not assigned on this order.' }, 400)
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)

    const assigned = await shiprocketRequest(settings, token, settings.assign_awb_path, {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: shipment.shiprocket_shipment_id,
        courier_id: order.shipping_courier_company_id,
      }),
    })

    const awbCode = String(
      assigned.response?.data?.awb_code ?? assigned.awb_code ?? assigned.data?.awb_code ?? '',
    )

    if (!awbCode) {
      return jsonResponse({ error: 'Shiprocket did not return an AWB code.' }, 502)
    }

    const { error: completeError } = await serviceClient.rpc('admin_complete_shiprocket_push', {
      p_order_id: body.orderId,
      p_shiprocket_order_id: shipment.shiprocket_order_id ?? null,
      p_shiprocket_shipment_id: shipment.shiprocket_shipment_id,
      p_awb_code: awbCode,
      p_courier_name: order.shipping_courier_name,
    })

    if (completeError) return jsonResponse({ error: completeError.message }, 500)

    return jsonResponse({
      ok: true,
      awbCode,
      courierName: order.shipping_courier_name,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required.' ? 403 : 500
    return jsonResponse({ error: message }, status)
  }
})
