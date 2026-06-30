import { createClient } from 'npm:@supabase/supabase-js@2'

type ExchangeRateResponse = {
  result: string
  base_code: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  conversion_rates: Record<string, number>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('EXCHANGERATE_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing EXCHANGERATE_API_KEY or Supabase env configuration.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const apiResponse = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`)
    if (!apiResponse.ok) {
      return new Response(JSON.stringify({ error: 'Exchange rate API request failed.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = (await apiResponse.json()) as ExchangeRateResponse
    if (payload.result !== 'success') {
      return new Response(JSON.stringify({ error: 'Exchange rate API returned non-success result.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: updatedCount, error } = await supabase.rpc('apply_fx_rate_snapshot', {
      payload,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        base_code: payload.base_code,
        updated_currencies: updatedCount,
        time_last_update_utc: payload.time_last_update_utc,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
