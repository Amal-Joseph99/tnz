import {
  assertAdmin,
  convertAmountToUsd,
  corsHeaders,
  createAuthedSupabase,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
} from '../_shared/shiprocket.ts'

type PushOrderRequest = {
  orderId: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)
    await assertAdmin(serviceClient, user.id)

    const body = await req.json() as PushOrderRequest
    if (!body.orderId) return jsonResponse({ error: 'orderId is required.' }, 400)

    const { data: order, error: orderError } = await serviceClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_order_items (*)
      `)
      .eq('id', body.orderId)
      .maybeSingle()

    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404)
    if (order.status !== 'seller_accepted' && order.status !== 'shiprocket_pending') {
      return jsonResponse({ error: 'Order must be seller-accepted before Shiprocket push.' }, 400)
    }

    const { data: warehouse, error: warehouseError } = await serviceClient
      .from('seller_warehouses')
      .select('shiprocket_pickup_location_name, warehouse_name')
      .eq('user_id', order.seller_user_id)
      .maybeSingle()

    if (warehouseError) return jsonResponse({ error: warehouseError.message }, 500)
    if (!warehouse?.shiprocket_pickup_location_name) {
      return jsonResponse({ error: 'Seller Shiprocket pickup location name is not configured.' }, 400)
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)
    const orderCurrency = String(order.currency_code ?? 'USD')

    await serviceClient.rpc('admin_mark_shiprocket_pending', { p_order_id: body.orderId })

    const paymentMethod = order.payment_method === 'cod' ? 'COD' : 'Prepaid'
    const items = await Promise.all(
      (order.marketplace_order_items ?? []).map(async (item: Record<string, unknown>) => ({
        name: item.product_name,
        sku: item.sku,
        units: item.quantity,
        selling_price: String(await convertAmountToUsd(serviceClient, Number(item.unit_price), orderCurrency)),
        hsn: item.hsn_code ?? '',
      })),
    )

    const subTotalUsd = await convertAmountToUsd(serviceClient, Number(order.subtotal_amount), orderCurrency)
    const shippingChargesUsd = await convertAmountToUsd(serviceClient, Number(order.shipping_amount), orderCurrency)

    const createPayload = {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().slice(0, 10),
      pickup_location: warehouse.shiprocket_pickup_location_name,
      billing_customer_name: order.delivery_full_name,
      billing_last_name: '',
      billing_address: order.delivery_address_line1,
      billing_address_2: order.delivery_address_line2 ?? '',
      billing_city: order.delivery_city,
      billing_state: order.delivery_state,
      billing_pincode: order.delivery_postcode,
      billing_country: order.delivery_country_iso2 === settings.origin_country_iso2 ? 'India' : order.delivery_country_iso2,
      billing_email: order.delivery_email,
      billing_phone: order.delivery_phone,
      shipping_is_billing: 1,
      payment_method: paymentMethod,
      sub_total: subTotalUsd,
      shipping_charges: shippingChargesUsd,
      order_items: items,
      weight: Number(order.package_weight_kg),
      length: Number(order.package_length_cm ?? 10),
      breadth: Number(order.package_width_cm ?? 10),
      height: Number(order.package_height_cm ?? 10),
    }

    const created = await shiprocketRequest(settings, token, settings.create_order_path, {
      method: 'POST',
      body: JSON.stringify(createPayload),
    })

    const shiprocketOrderId = Number(created.order_id ?? created.data?.order_id ?? created.shipment_id ?? 0)
    const shiprocketShipmentId = Number(created.shipment_id ?? created.data?.shipment_id ?? 0)

    if (!shiprocketShipmentId) {
      return jsonResponse({ error: 'Shiprocket order created but shipment id was missing.' }, 502)
    }

    const assignPayload: Record<string, unknown> = {
      shipment_id: shiprocketShipmentId,
    }
    if (order.shipping_courier_company_id) {
      assignPayload.courier_id = order.shipping_courier_company_id
    }

    const assigned = await shiprocketRequest(settings, token, settings.assign_awb_path, {
      method: 'POST',
      body: JSON.stringify(assignPayload),
    })

    const awbCode = String(assigned.response?.data?.awb_code ?? assigned.awb_code ?? assigned.data?.awb_code ?? '')

    const { error: completeError } = await serviceClient.rpc('admin_complete_shiprocket_push', {
      p_order_id: body.orderId,
      p_shiprocket_order_id: shiprocketOrderId || null,
      p_shiprocket_shipment_id: shiprocketShipmentId,
      p_awb_code: awbCode,
      p_courier_name: order.shipping_courier_name,
    })

    if (completeError) return jsonResponse({ error: completeError.message }, 500)

    return jsonResponse({
      ok: true,
      shiprocketOrderId,
      shiprocketShipmentId,
      awbCode,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : message === 'Admin access required.' ? 403 : 500
    return jsonResponse({ error: message }, status)
  }
})
