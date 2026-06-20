import {
  assertSellerOwnsOrder,
  corsHeaders,
  createAuthedSupabase,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type DocumentsRequest = {
  orderId: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    const body = await req.json() as DocumentsRequest
    if (!body.orderId) return jsonResponse({ error: 'orderId is required.' }, 400)

    await assertSellerOwnsOrder(serviceClient, body.orderId, user.id)

    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select('status')
      .eq('id', body.orderId)
      .maybeSingle()

    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order || !['shiprocket_created', 'packed', 'shipped', 'delivered'].includes(order.status)) {
      return jsonResponse({ error: 'Shiprocket documents are available after admin creates the shipment.' }, 400)
    }

    const { data: shipment, error: shipmentError } = await serviceClient
      .from('marketplace_order_shipments')
      .select('*')
      .eq('order_id', body.orderId)
      .maybeSingle()

    if (shipmentError) return jsonResponse({ error: shipmentError.message }, 500)
    if (!shipment?.shiprocket_shipment_id) {
      return jsonResponse({ error: 'Shipment is not linked to Shiprocket yet.' }, 400)
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)

    const labelPayload = await shiprocketRequest(settings, token, settings.generate_label_path, {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [shipment.shiprocket_shipment_id] }),
    })

    const manifestGenerated = await shiprocketRequest(settings, token, settings.generate_manifest_path, {
      method: 'POST',
      body: JSON.stringify({ shipment_id: [shipment.shiprocket_shipment_id] }),
    })

    const manifestId = manifestGenerated.manifest_id ?? manifestGenerated.data?.manifest_id
    let manifestUrl = shipment.manifest_url

    if (manifestId) {
      const manifestPrinted = await shiprocketRequest(settings, token, settings.print_manifest_path, {
        method: 'POST',
        body: JSON.stringify({ manifest_id: manifestId }),
      })
      manifestUrl = manifestPrinted.manifest_url ?? manifestPrinted.data?.manifest_url ?? manifestUrl
    }

    const labelUrl = labelPayload.label_url
      ?? labelPayload.data?.label_url
      ?? labelPayload.response?.data?.label_url
      ?? shipment.label_url

    const { error: updateError } = await serviceClient.rpc('update_shipment_documents', {
      p_order_id: body.orderId,
      p_label_url: labelUrl ?? '',
      p_manifest_url: manifestUrl ?? '',
    })

    if (updateError) return jsonResponse({ error: updateError.message }, 500)

    return jsonResponse({
      ok: true,
      labelUrl,
      manifestUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : 500
    return jsonResponse({ error: message }, status)
  }
})
