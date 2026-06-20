import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  encodeFormBody,
  getCheckoutSiteUrl,
  getStripeClient,
  stripeCorsHeaders,
  stripeJsonResponse,
  toStripeMinorAmount,
} from '../_shared/stripe.ts'

type CheckoutItem = {
  productId: number
  sellerUserId: string
  sku: string
  title: string
  quantity: number
  unitPrice: number
  variantId?: number
}

type CreateCheckoutRequest = {
  sellerUserId: string
  currencyCode: string
  subtotal: number
  shippingAmount: number
  codChargesAmount: number
  taxAmount: number
  totalAmount: number
  delivery: Record<string, string>
  shippingQuote: Record<string, unknown>
  items: CheckoutItem[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: stripeCorsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return stripeJsonResponse({ error: 'Server configuration error.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) {
      return stripeJsonResponse({ error: 'Authentication required.' }, 401)
    }

    const body = await req.json() as CreateCheckoutRequest
    if (!body.sellerUserId || !body.currencyCode || !body.delivery || !Array.isArray(body.items) || body.items.length === 0) {
      return stripeJsonResponse({ error: 'Invalid checkout payload.' }, 400)
    }

    const { data: orderResult, error: orderError } = await userClient.rpc('create_marketplace_order', {
      p_seller_user_id: body.sellerUserId,
      p_payment_method: 'prepaid',
      p_currency_code: body.currencyCode,
      p_subtotal: body.subtotal,
      p_shipping_amount: body.shippingAmount,
      p_cod_charges_amount: body.codChargesAmount,
      p_tax_amount: body.taxAmount,
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
      return stripeJsonResponse({ error: orderError.message }, 400)
    }

    const orderId = Number(orderResult.orderId)
    const orderNumber = String(orderResult.orderNumber)
    const currency = body.currencyCode.trim().toLowerCase()
    const amountMinor = toStripeMinorAmount(body.totalAmount, currency)
    const siteUrl = getCheckoutSiteUrl(req.headers.get('origin'))
    const stripe = getStripeClient()

    const session = await stripe.request('/checkout/sessions', {
      method: 'POST',
      body: encodeFormBody({
        mode: 'payment',
        success_url: `${siteUrl}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout/review`,
        client_reference_id: String(orderId),
        customer_email: body.delivery.email,
        'metadata[order_id]': String(orderId),
        'metadata[order_number]': orderNumber,
        'metadata[buyer_user_id]': authData.user.id,
        'line_items[0][quantity]': 1,
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][unit_amount]': amountMinor,
        'line_items[0][price_data][product_data][name]': `AGTRENZ order ${orderNumber}`,
        'line_items[0][price_data][product_data][description]': 'Global marketplace order',
      }),
    })

    const sessionId = String(session.id)
    const { error: recordError } = await serviceClient.rpc('record_stripe_checkout_session', {
      p_order_id: orderId,
      p_stripe_checkout_session_id: sessionId,
      p_amount_minor: amountMinor,
      p_currency_code: currency.toUpperCase(),
    })

    if (recordError) {
      return stripeJsonResponse({ error: recordError.message }, 500)
    }

    return stripeJsonResponse({
      ok: true,
      orderId,
      orderNumber,
      sessionId,
      checkoutUrl: session.url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return stripeJsonResponse({ error: message }, 500)
  }
})
