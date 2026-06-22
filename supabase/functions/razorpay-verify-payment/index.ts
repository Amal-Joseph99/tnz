import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  getRazorpayCredentials,
  razorpayCorsHeaders,
  razorpayJsonResponse,
  verifyRazorpaySignature,
} from '../_shared/razorpay.ts'

type VerifyPaymentRequest = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
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

    const body = await req.json() as VerifyPaymentRequest
    const razorpayOrderId = body.razorpay_order_id?.trim()
    const razorpayPaymentId = body.razorpay_payment_id?.trim()
    const razorpaySignature = body.razorpay_signature?.trim()

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return razorpayJsonResponse({ error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.' }, 400)
    }

    const { keySecret } = getRazorpayCredentials()
    const signatureValid = await verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      keySecret,
    )

    if (!signatureValid) {
      return razorpayJsonResponse({ error: 'Payment signature verification failed.' }, 400)
    }

    const { data: paymentRow, error: paymentError } = await serviceClient
      .from('payment_transactions')
      .select('order_id, amount_minor, currency_code, status')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('provider', 'razorpay')
      .maybeSingle()

    if (paymentError) {
      return razorpayJsonResponse({ error: paymentError.message }, 500)
    }

    if (!paymentRow) {
      return razorpayJsonResponse({ error: 'Payment record not found.' }, 404)
    }

    const { data: order, error: orderError } = await userClient
      .from('marketplace_orders')
      .select('id, buyer_user_id')
      .eq('id', paymentRow.order_id)
      .maybeSingle()

    if (orderError) {
      return razorpayJsonResponse({ error: orderError.message }, 500)
    }

    if (!order || order.buyer_user_id !== authData.user.id) {
      return razorpayJsonResponse({ error: 'Order not found.' }, 404)
    }

    const { data: confirmResult, error: confirmError } = await serviceClient.rpc('confirm_marketplace_razorpay_payment', {
      p_order_id: paymentRow.order_id,
      p_razorpay_order_id: razorpayOrderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_amount_minor: paymentRow.amount_minor,
      p_currency_code: paymentRow.currency_code,
      p_raw_payload: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
      },
    })

    if (confirmError) {
      return razorpayJsonResponse({ error: confirmError.message }, 500)
    }

    return razorpayJsonResponse({
      ok: true,
      success: true,
      orderNumber: confirmResult.orderNumber,
      orderId: confirmResult.orderId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return razorpayJsonResponse({ error: message }, 500)
  }
})
