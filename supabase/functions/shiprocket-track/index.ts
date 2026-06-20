import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  corsHeaders,
  getShiprocketToken,
  jsonResponse,
  loadShiprocketSettings,
  shiprocketRequest,
  trackPath,
} from '../_shared/shiprocket.ts'

type TrackRequest = {
  orderId?: number
  orderNumber?: string
  email?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error.' }, 500)
    }

    const body = await req.json() as TrackRequest
    if (!body.orderId && !body.orderNumber) {
      return jsonResponse({ error: 'orderId or orderNumber is required.' }, 400)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const authHeader = req.headers.get('Authorization') ?? ''
    let userId: string | null = null

    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data } = await userClient.auth.getUser()
      userId = data.user?.id ?? null
    }

    let query = serviceClient
      .from('marketplace_orders')
      .select(`
        id,
        order_number,
        buyer_user_id,
        seller_user_id,
        delivery_email,
        status,
        marketplace_order_shipments (*)
      `)

    query = body.orderId ? query.eq('id', body.orderId) : query.eq('order_number', body.orderNumber ?? '')

    const { data: order, error: orderError } = await query.maybeSingle()
    if (orderError) return jsonResponse({ error: orderError.message }, 500)
    if (!order) return jsonResponse({ error: 'Order not found.' }, 404)

    if (userId) {
      const { data: adminRow } = await serviceClient
        .from('staff_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle()

      const allowed = order.buyer_user_id === userId
        || order.seller_user_id === userId
        || Boolean(adminRow)

      if (!allowed) return jsonResponse({ error: 'You do not have access to this order.' }, 403)
    } else {
      const email = body.email?.trim().toLowerCase()
      if (!email || order.delivery_email?.toLowerCase() !== email) {
        return jsonResponse({ error: 'Valid order number and checkout email are required.' }, 403)
      }
    }

    const shipment = Array.isArray(order.marketplace_order_shipments)
      ? order.marketplace_order_shipments[0]
      : order.marketplace_order_shipments

    if (!shipment?.awb_code) {
      return jsonResponse({
        ok: true,
        orderNumber: order.order_number,
        status: order.status,
        tracking: null,
        message: 'Tracking will appear after Shiprocket AWB is assigned.',
      })
    }

    const settings = await loadShiprocketSettings(serviceClient)
    const token = await getShiprocketToken(serviceClient, settings)
    const tracking = await shiprocketRequest(settings, token, trackPath(settings, shipment.awb_code), {
      method: 'GET',
    })

    const markShipped = order.status === 'packed' || order.status === 'shiprocket_created'
    await serviceClient.rpc('update_shipment_tracking', {
      p_order_id: order.id,
      p_tracking_payload: tracking,
      p_mark_shipped: markShipped,
    })

    return jsonResponse({
      ok: true,
      orderNumber: order.order_number,
      status: order.status,
      awbCode: shipment.awb_code,
      tracking,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
