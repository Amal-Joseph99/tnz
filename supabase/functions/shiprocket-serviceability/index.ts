import {
  assertAdmin,
  corsHeaders,
  createAuthedSupabase,
  fetchShiprocketServiceability,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
} from '../_shared/shiprocket.ts'

type ServiceabilityRequest = {
  sellerUserId: string
  deliveryPostcode?: string
  deliveryCountryIso2: string
  paymentMethod?: 'prepaid' | 'cod'
  items: Array<{ productId: number; quantity: number }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userClient, serviceClient } = await createAuthedSupabase(req)
    const body = await req.json() as ServiceabilityRequest

    if (!body.sellerUserId || !body.deliveryCountryIso2 || !Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: 'sellerUserId, deliveryCountryIso2, and items are required.' }, 400)
    }

    const { data: originOk, error: originError } = await userClient.rpc('is_india_origin_seller', {
      p_seller_user_id: body.sellerUserId,
    })
    if (originError) return jsonResponse({ error: originError.message }, 400)
    if (!originOk) {
      return jsonResponse({ error: 'Shiprocket rates are only available for India-origin seller products.' }, 400)
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const deliveryIso2 = body.deliveryCountryIso2.toUpperCase()
    const isDomestic = deliveryIso2 === settings.origin_country_iso2

    if (!isDomestic && body.paymentMethod === 'cod') {
      return jsonResponse({ error: 'Cash on delivery is not available for international shipments.' }, 400)
    }

    if (isDomestic && !body.deliveryPostcode) {
      return jsonResponse({ error: 'deliveryPostcode is required for India domestic shipping.' }, 400)
    }

    const productIds = body.items.map((item) => item.productId)
    const { data: products, error: productsError } = await serviceClient
      .from('seller_products')
      .select('id, weight_kg, package_length_cm, package_width_cm, package_height_cm, user_id, approval_status')
      .in('id', productIds)
      .eq('user_id', body.sellerUserId)
      .eq('approval_status', 'approved')

    if (productsError) return jsonResponse({ error: productsError.message }, 500)
    if (!products || products.length !== productIds.length) {
      return jsonResponse({ error: 'One or more products are unavailable for shipping quote.' }, 400)
    }

    const { data: warehouse, error: warehouseError } = await serviceClient
      .from('seller_warehouses')
      .select('postal_code')
      .eq('user_id', body.sellerUserId)
      .eq('is_completed', true)
      .maybeSingle()

    if (warehouseError) return jsonResponse({ error: warehouseError.message }, 500)
    if (!warehouse?.postal_code) {
      return jsonResponse({ error: 'Seller warehouse pickup postcode is not configured.' }, 400)
    }

    let totalWeight = 0
    let maxLength = 0
    let maxWidth = 0
    let maxHeight = 0

    for (const item of body.items) {
      const product = products.find((row) => row.id === item.productId)
      if (!product) continue
      totalWeight += Number(product.weight_kg) * item.quantity
      maxLength = Math.max(maxLength, Number(product.package_length_cm ?? 0))
      maxWidth = Math.max(maxWidth, Number(product.package_width_cm ?? 0))
      maxHeight = Math.max(maxHeight, Number(product.package_height_cm ?? 0))
    }

    if (totalWeight <= 0) {
      return jsonResponse({ error: 'Shipment weight must be greater than zero.' }, 400)
    }

    const token = await getShiprocketToken(serviceClient, settings)
    const quote = await fetchShiprocketServiceability({
      settings,
      token,
      pickupPostcode: warehouse.postal_code,
      deliveryPostcode: body.deliveryPostcode,
      deliveryCountryIso2: deliveryIso2,
      weightKg: Number(totalWeight.toFixed(3)),
      cod: body.paymentMethod === 'cod',
      lengthCm: maxLength || null,
      widthCm: maxWidth || null,
      heightCm: maxHeight || null,
    })

    if (!quote.serviceable) {
      return jsonResponse({
        serviceable: false,
        shippingLane: quote.shippingLane,
        message: 'Delivery is not serviceable for this India-origin shipment.',
      })
    }

    return jsonResponse({ serviceable: true, quote })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message === 'Unauthorized' ? 401 : 500
    return jsonResponse({ error: message }, status)
  }
})
