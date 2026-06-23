import {
  assertFulfillmentAccess,
  corsHeaders,
  createAuthedSupabase,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type DocumentsRequest = {
  orderId: number
  documentType?: 'label' | 'manifest' | 'all'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    const body = await req.json() as DocumentsRequest
    if (!body.orderId) return jsonResponse({ error: 'orderId is required.' }, 400)

    await assertFulfillmentAccess(serviceClient, body.orderId, user.id)

    const documentType = body.documentType ?? 'all'

    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select('status')
      .eq('id', body.orderId)
      .maybeSingle()

    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order || !['shiprocket_created', 'packed', 'shipped', 'delivered'].includes(order.status)) {
      return jsonResponse({ error: 'Shipping documents are available after the shipment is created.' }, 400)
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

    let labelUrl = shipment.label_url as string | null
    let manifestUrl = shipment.manifest_url as string | null

    if (documentType === 'label' || documentType === 'all') {
      const labelPayload = await shiprocketRequest(settings, token, settings.generate_label_path, {
        method: 'POST',
        body: JSON.stringify({ shipment_id: [shipment.shiprocket_shipment_id] }),
      })

      labelUrl = labelPayload.label_url
        ?? labelPayload.data?.label_url
        ?? labelPayload.response?.data?.label_url
        ?? labelUrl
    }

    if (documentType === 'manifest' || documentType === 'all') {
      const manifestGenerated = await shiprocketRequest(settings, token, settings.generate_manifest_path, {
        method: 'POST',
        body: JSON.stringify({ shipment_id: [shipment.shiprocket_shipment_id] }),
      })

      const manifestId = manifestGenerated.manifest_id ?? manifestGenerated.data?.manifest_id
      if (manifestId) {
        const manifestPrinted = await shiprocketRequest(settings, token, settings.print_manifest_path, {
          method: 'POST',
          body: JSON.stringify({ manifest_id: manifestId }),
        })
        manifestUrl = manifestPrinted.manifest_url ?? manifestPrinted.data?.manifest_url ?? manifestUrl
      }
    }

    const { error: updateError } = await serviceClient.rpc('update_shipment_documents', {
      p_order_id: body.orderId,
      p_label_url: documentType === 'manifest' ? null : (labelUrl ?? ''),
      p_manifest_url: documentType === 'label' ? null : (manifestUrl ?? ''),
    })

    if (updateError) return jsonResponse({ error: updateError.message }, 500)

    return jsonResponse({
      ok: true,
      labelUrl: documentType === 'manifest' ? null : labelUrl,
      manifestUrl: documentType === 'label' ? null : manifestUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : message === 'Order not found.' ? 403 : 500
    return jsonResponse({ error: message }, status)
  }
})
