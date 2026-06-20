import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

type ShiprocketWebhookPayload = {
  awb?: string
  order_id?: string
  sr_order_id?: number | string
  current_status?: string
  shipment_status?: string
  shipment_status_id?: number
  current_status_id?: number
  etd?: string
  scans?: unknown
}

function mapShipmentStatus(payload: ShiprocketWebhookPayload) {
  const statusId = Number(payload.shipment_status_id ?? payload.current_status_id ?? 0)
  const label = String(payload.shipment_status ?? payload.current_status ?? '').toUpperCase()

  if (statusId === 7 || label.includes('DELIVERED')) return 'delivered'
  if (statusId === 6 || label.includes('SHIPPED') || label.includes('TRANSIT') || label.includes('OUT FOR DELIVERY')) {
    return 'shipped'
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const webhookSecret = Deno.env.get('SHIPROCKET_WEBHOOK_SECRET')
  if (webhookSecret) {
    const provided = req.headers.get('x-api-key')
    if (provided !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized webhook' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json() as ShiprocketWebhookPayload
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    let orderId: number | null = null

    if (payload.sr_order_id) {
      const { data } = await supabase
        .from('marketplace_order_shipments')
        .select('order_id')
        .eq('shiprocket_order_id', Number(payload.sr_order_id))
        .maybeSingle()
      orderId = data?.order_id ?? null
    }

    if (!orderId && payload.awb) {
      const { data } = await supabase
        .from('marketplace_order_shipments')
        .select('order_id')
        .eq('awb_code', payload.awb)
        .maybeSingle()
      orderId = data?.order_id ?? null
    }

    if (!orderId && payload.order_id) {
      const { data } = await supabase
        .from('marketplace_orders')
        .select('id')
        .eq('order_number', payload.order_id)
        .maybeSingle()
      orderId = data?.id ?? null
    }

    if (orderId) {
      const mappedStatus = mapShipmentStatus(payload)
      await supabase.rpc('update_shipment_tracking', {
        p_order_id: orderId,
        p_tracking_payload: payload,
        p_mark_shipped: mappedStatus === 'shipped',
      })

      if (mappedStatus === 'delivered') {
        await supabase.rpc('mark_marketplace_order_delivered', { p_order_id: orderId })
      }
    }

    return new Response(JSON.stringify({ ok: true, message: 'Webhook received successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ ok: true, message: 'Webhook received successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
