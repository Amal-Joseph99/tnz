import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  getStripeClient,
  stripeCorsHeaders,
  stripeJsonResponse,
} from '../_shared/stripe.ts'

type StatusRequest = {
  sessionId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: stripeCorsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !anonKey) {
      return stripeJsonResponse({ error: 'Server configuration error.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) {
      return stripeJsonResponse({ error: 'Authentication required.' }, 401)
    }

    const body = await req.json() as StatusRequest
    if (!body.sessionId?.trim()) {
      return stripeJsonResponse({ error: 'sessionId is required.' }, 400)
    }

    const stripe = getStripeClient()
    const session = await stripe.request(`/checkout/sessions/${encodeURIComponent(body.sessionId.trim())}`)

    const orderId = Number(session.metadata?.order_id ?? session.client_reference_id ?? 0)
    if (!orderId) {
      return stripeJsonResponse({ error: 'Checkout session is missing order metadata.' }, 400)
    }

    const { data: order, error: orderError } = await userClient
      .from('marketplace_orders')
      .select('id, order_number, status, payment_status, buyer_user_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) {
      return stripeJsonResponse({ error: orderError.message }, 500)
    }

    if (!order || order.buyer_user_id !== authData.user.id) {
      return stripeJsonResponse({ error: 'Order not found.' }, 404)
    }

    return stripeJsonResponse({
      ok: true,
      paid: session.payment_status === 'paid' || order.payment_status === 'paid',
      orderNumber: order.order_number,
      orderStatus: order.status,
      paymentStatus: order.payment_status,
      stripePaymentStatus: session.payment_status,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return stripeJsonResponse({ error: message }, 500)
  }
})
