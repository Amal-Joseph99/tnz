import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  stripeCorsHeaders,
  stripeJsonResponse,
  verifyStripeWebhookSignature,
} from '../_shared/stripe.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: stripeCorsHeaders })
  }

  if (req.method !== 'POST') {
    return stripeJsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return stripeJsonResponse({ error: 'Server configuration error.' }, 500)
  }

  try {
    const rawBody = await req.text()
    const event = await verifyStripeWebhookSignature(
      rawBody,
      req.headers.get('stripe-signature'),
      webhookSecret,
    )

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const eventType = String(event.type ?? '')
    const object = (event.data as { object?: Record<string, unknown> } | undefined)?.object ?? {}

    if (eventType === 'checkout.session.completed') {
      const paymentStatus = String(object.payment_status ?? '')
      if (paymentStatus !== 'paid') {
        return stripeJsonResponse({ ok: true, ignored: true })
      }

      const metadata = (object.metadata ?? {}) as Record<string, string>
      const orderId = Number(metadata.order_id ?? object.client_reference_id ?? 0)
      const sessionId = String(object.id ?? '')
      const paymentIntentId = String(object.payment_intent ?? '')
      const amountMinor = Number(object.amount_total ?? 0)
      const currencyCode = String(object.currency ?? '').toUpperCase()

      if (!orderId || !sessionId || !amountMinor || !currencyCode) {
        return stripeJsonResponse({ error: 'Incomplete Stripe checkout session payload.' }, 400)
      }

      const { error } = await serviceClient.rpc('confirm_marketplace_stripe_payment', {
        p_order_id: orderId,
        p_stripe_checkout_session_id: sessionId,
        p_stripe_payment_intent_id: paymentIntentId || null,
        p_amount_minor: amountMinor,
        p_currency_code: currencyCode,
        p_raw_payload: object,
      })

      if (error) {
        return stripeJsonResponse({ error: error.message }, 500)
      }
    }

    if (eventType === 'checkout.session.expired') {
      const metadata = (object.metadata ?? {}) as Record<string, string>
      const orderId = Number(metadata.order_id ?? object.client_reference_id ?? 0)
      const sessionId = String(object.id ?? '')
      if (orderId && sessionId) {
        await serviceClient.rpc('fail_marketplace_stripe_payment', {
          p_order_id: orderId,
          p_stripe_checkout_session_id: sessionId,
          p_raw_payload: object,
        })
      }
    }

    return stripeJsonResponse({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return stripeJsonResponse({ error: message }, 400)
  }
})
