import { getStripeClient, stripeCorsHeaders } from '../_shared/stripe.ts'
import { createAuthedSupabase, jsonResponse } from '../_shared/shiprocket.ts'

type ReviewReturnRequest = {
  returnRequestId: number
  approve: boolean
  adminNote?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: stripeCorsHeaders })
  }

  try {
    const { user, serviceClient } = await createAuthedSupabase(req)

    const { data: adminRow } = await serviceClient
      .from('staff_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRow) return jsonResponse({ error: 'Admin access required.' }, 403)

    const body = await req.json() as ReviewReturnRequest
    if (!body.returnRequestId) return jsonResponse({ error: 'returnRequestId is required.' }, 400)

    const { data: reviewResult, error: reviewError } = await serviceClient.rpc('review_return_request', {
      p_return_request_id: body.returnRequestId,
      p_approve: body.approve,
      p_admin_note: body.adminNote ?? null,
    })

    if (reviewError) return jsonResponse({ error: reviewError.message }, 400)

    const needsStripeRefund = Boolean(reviewResult?.needsStripeRefund)
    if (!needsStripeRefund) {
      return jsonResponse({ ok: true, reviewResult })
    }

    const { data: refundContext, error: contextError } = await serviceClient.rpc('get_return_refund_context', {
      p_return_request_id: body.returnRequestId,
    })

    if (contextError) return jsonResponse({ error: contextError.message }, 500)

    const paymentIntentId = String(refundContext?.stripePaymentIntentId ?? '')
    if (!paymentIntentId) {
      return jsonResponse({ error: 'No Stripe payment intent found for this order.' }, 400)
    }

    const stripe = getStripeClient()
    const refund = await stripe.request('/refunds', {
      method: 'POST',
      body: new URLSearchParams({
        payment_intent: paymentIntentId,
      }).toString(),
    })

    const refundId = String(refund.id ?? '')
    const { error: completeError } = await serviceClient.rpc('complete_return_stripe_refund', {
      p_return_request_id: body.returnRequestId,
      p_stripe_refund_id: refundId,
      p_success: true,
    })

    if (completeError) return jsonResponse({ error: completeError.message }, 500)

    return jsonResponse({ ok: true, refundId, reviewResult })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
