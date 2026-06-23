import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  createRazorpayOrder,
  razorpayCorsHeaders,
  razorpayJsonResponse,
  toRazorpayMinorAmount,
  getRazorpayCredentials,
} from '../_shared/razorpay.ts'

type CheckoutItem = {
  productId: number
  sellerUserId: string
  sku: string
  title: string
  quantity: number
  unitPrice: number
  variantId?: number
}

type CreateOrderRequest = {
  sellerUserId: string
  currencyCode: string
  subtotal: number
  shippingAmount: number
  codChargesAmount: number
  totalAmount: number
  delivery: Record<string, string>
  shippingQuote: Record<string, unknown>
  items: CheckoutItem[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: razorpayCorsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return razorpayJsonResponse({ error: 'Server configuration error.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) {
      return razorpayJsonResponse({ error: 'Authentication required.' }, 401)
    }

    const body = await req.json() as CreateOrderRequest
    if (!body.sellerUserId || !body.currencyCode || !body.delivery || !Array.isArray(body.items) || body.items.length === 0) {
      return razorpayJsonResponse({ error: 'Invalid checkout payload.' }, 400)
    }

    const currency = body.currencyCode.trim().toUpperCase()

    let amountMinor: number
    try {
      amountMinor = toRazorpayMinorAmount(body.totalAmount, currency)
    } catch (amountError) {
      const message = amountError instanceof Error ? amountError.message : 'Invalid order amount.'
      return razorpayJsonResponse({ error: message }, 400)
    }

    if (amountMinor < 100) {
      return razorpayJsonResponse({ error: 'Order amount must be at least 100 in the smallest currency unit.' }, 400)
    }

    const { data: orderResult, error: orderError } = await userClient.rpc('create_marketplace_order', {
      p_seller_user_id: body.sellerUserId,
      p_payment_method: 'prepaid',
      p_currency_code: currency,
      p_subtotal: body.subtotal,
      p_shipping_amount: body.shippingAmount,
      p_cod_charges_amount: body.codChargesAmount,
      p_tax_amount: 0,
      p_total_amount: body.totalAmount,
      p_delivery: body.delivery,
      p_shipping_quote: body.shippingQuote,
      p_items: body.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? '',
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })),
    })

    if (orderError) {
      return razorpayJsonResponse({ error: orderError.message }, 400)
    }

    if (!orderResult || typeof orderResult !== 'object' || !('orderId' in orderResult)) {
      return razorpayJsonResponse({ error: 'Order creation returned an invalid response.' }, 500)
    }

    const orderId = Number(orderResult.orderId)
    const orderNumber = String(orderResult.orderNumber)

    let razorpayOrder
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: amountMinor,
        currency,
        receipt: orderNumber,
      })
    } catch (razorpayError) {
      const message = razorpayError instanceof Error ? razorpayError.message : 'Razorpay order creation failed.'
      const status = (razorpayError as Error & { status?: number }).status === 401 ? 401 : 500
      return razorpayJsonResponse({ error: message }, status)
    }

    const { error: recordError } = await serviceClient.rpc('record_razorpay_order', {
      p_order_id: orderId,
      p_razorpay_order_id: razorpayOrder.id,
      p_amount_minor: amountMinor,
      p_currency_code: currency,
    })

    if (recordError) {
      return razorpayJsonResponse({ error: recordError.message }, 500)
    }

    const { keyId } = getRazorpayCredentials()

    return razorpayJsonResponse({
      ok: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId,
      orderNumber,
      key_id: keyId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('Missing Razorpay credentials') ? 500 : 500
    return razorpayJsonResponse({ error: message }, status)
  }
})
