import { createRazorpayRefund } from '../_shared/razorpay.ts'
import { createAuthedSupabase, jsonResponse } from '../_shared/shiprocket.ts'

type ReviewReturnRequest = {
  returnRequestId: number
  approve: boolean
  adminNote?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
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

    const needsPaymentRefund = Boolean(reviewResult?.needsPaymentRefund)
    if (!needsPaymentRefund) {
      return jsonResponse({ ok: true, reviewResult })
    }

    const { data: refundContext, error: contextError } = await serviceClient.rpc('get_return_refund_context', {
      p_return_request_id: body.returnRequestId,
    })

    if (contextError) return jsonResponse({ error: contextError.message }, 500)

    const paymentId = String(refundContext?.razorpayPaymentId ?? '')
    if (!paymentId) {
      return jsonResponse({ error: 'No Razorpay payment found for this order.' }, 400)
    }

    const amountMinor = Number(refundContext?.amountMinor ?? 0)
    const refund = await createRazorpayRefund(paymentId, amountMinor > 0 ? amountMinor : undefined)
    const refundId = String(refund.id ?? '')

    const { error: completeError } = await serviceClient.rpc('complete_return_payment_refund', {
      p_return_request_id: body.returnRequestId,
      p_refund_id: refundId,
      p_success: true,
    })

    if (completeError) return jsonResponse({ error: completeError.message }, 500)

    return jsonResponse({ ok: true, refundId, reviewResult })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
