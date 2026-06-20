import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export type ShippingProviderSettings = {
  provider: string
  origin_country_iso2: string
  api_base_url: string
  domestic_serviceability_path: string
  international_serviceability_path: string
  auth_login_path: string
  create_order_path: string
  assign_awb_path: string
  generate_label_path: string
  generate_manifest_path: string
  print_manifest_path: string
  track_awb_path_template: string
}

export type ShippingQuote = {
  serviceable: boolean
  shippingLane: 'india_domestic' | 'india_international'
  shippingCharge: number
  codCharges: number
  totalShippingCharge: number
  estimatedDelivery: string | null
  courierCompanyId: number | null
  courierName: string | null
  codAvailable: boolean
  weightKg: number
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
}

type CourierRow = Record<string, unknown>

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function pickCouriers(payload: unknown): CourierRow[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  const data = root.data
  if (!data || typeof data !== 'object') return []

  const dataObj = data as Record<string, unknown>
  const list = dataObj.available_courier_companies ?? dataObj.available_courier_company ?? dataObj.couriers
  return Array.isArray(list) ? list as CourierRow[] : []
}

export function pickLowestCourierQuote(couriers: CourierRow[], cod: boolean) {
  let best: CourierRow | null = null
  let bestTotal = Number.POSITIVE_INFINITY

  for (const courier of couriers) {
    const freight = asNumber(courier.freight_charge ?? courier.rate ?? courier.total_charges)
    const codCharge = cod ? asNumber(courier.cod_charges ?? courier.cod_charge) : 0
    const total = freight + codCharge

    if (total < bestTotal) {
      best = courier
      bestTotal = total
    }
  }

  if (!best) return null

  const freight = asNumber(best.freight_charge ?? best.rate ?? best.total_charges)
  const codCharge = cod ? asNumber(best.cod_charges ?? best.cod_charge) : 0

  return {
    shippingCharge: freight,
    codCharges: codCharge,
    totalShippingCharge: freight + codCharge,
    estimatedDelivery: String(best.etd ?? best.estimated_delivery_days ?? best.edd ?? '') || null,
    courierCompanyId: asNumber(best.courier_company_id ?? best.id, NaN) || null,
    courierName: String(best.courier_name ?? best.name ?? '') || null,
  }
}

export async function loadShiprocketSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('shipping_provider_settings')
    .select('*')
    .eq('provider', 'shiprocket')
    .eq('is_enabled', true)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Shiprocket provider settings are not configured.')
  return data as ShippingProviderSettings
}

async function readCachedToken(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('shiprocket_auth_cache')
    .select('access_token, expires_at')
    .eq('provider', 'shiprocket')
    .maybeSingle()

  if (!data) return null
  if (new Date(data.expires_at).getTime() <= Date.now() + 60_000) return null
  return data.access_token as string
}

async function storeCachedToken(supabase: SupabaseClient, token: string, companyId: number | null) {
  const expiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('shiprocket_auth_cache').upsert({
    provider: 'shiprocket',
    access_token: token,
    company_id: companyId,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  })
}

export function roundUsd(amount: number) {
  return Math.round(amount * 100) / 100
}

export async function convertAmountToUsd(
  supabase: SupabaseClient,
  amount: number,
  currencyCode: string,
) {
  const code = currencyCode.trim().toUpperCase()
  if (code === 'USD') return roundUsd(amount)

  const { data, error } = await supabase
    .from('countries')
    .select('fx_rate_usd')
    .eq('currency_code', code)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.fx_rate_usd) {
    throw new Error(`FX rate not configured for currency ${code}.`)
  }

  const fxRateUsd = Number(data.fx_rate_usd)
  if (!Number.isFinite(fxRateUsd) || fxRateUsd <= 0) {
    throw new Error(`Invalid FX rate for currency ${code}.`)
  }

  return roundUsd(amount / fxRateUsd)
}

export async function getShiprocketToken(supabase: SupabaseClient, settings: ShippingProviderSettings) {
  const cached = await readCachedToken(supabase)
  if (cached) return cached

  const email = Deno.env.get('SHIPROCKET_API_EMAIL')
  const password = Deno.env.get('SHIPROCKET_API_PASSWORD')
  if (!email || !password) {
    throw new Error('Missing SHIPROCKET_API_EMAIL or SHIPROCKET_API_PASSWORD secrets.')
  }

  const response = await fetch(`${settings.api_base_url}${settings.auth_login_path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'Shiprocket authentication failed.')
  }

  const token = String(payload.token ?? '')
  if (!token) throw new Error('Shiprocket authentication returned no token.')

  await storeCachedToken(supabase, token, payload.company_id ?? null)
  return token
}

function buildServiceabilityQuery(params: Record<string, string | number>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  return search.toString()
}

export async function fetchShiprocketServiceability(input: {
  settings: ShippingProviderSettings
  token: string
  pickupPostcode: string
  deliveryPostcode?: string
  deliveryCountryIso2: string
  weightKg: number
  cod: boolean
  lengthCm?: number | null
  widthCm?: number | null
  heightCm?: number | null
  declaredValue?: number
}) {
  const isDomestic = input.deliveryCountryIso2.toUpperCase() === input.settings.origin_country_iso2.toUpperCase()
  const path = isDomestic
    ? input.settings.domestic_serviceability_path
    : input.settings.international_serviceability_path

  const query = isDomestic
    ? buildServiceabilityQuery({
      pickup_postcode: input.pickupPostcode,
      delivery_postcode: input.deliveryPostcode ?? '',
      weight: input.weightKg,
      cod: input.cod ? 1 : 0,
      length: input.lengthCm ?? '',
      breadth: input.widthCm ?? '',
      height: input.heightCm ?? '',
      declared_value: input.declaredValue ?? '',
    })
    : buildServiceabilityQuery({
      pickup_postcode: input.pickupPostcode,
      delivery_country: input.deliveryCountryIso2.toUpperCase(),
      weight: input.weightKg,
      cod: 0,
    })

  const response = await fetch(`${input.settings.api_base_url}${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'Shiprocket serviceability failed.')
  }

  const couriers = pickCouriers(payload)
  const prepaidQuote = pickLowestCourierQuote(couriers, false)
  const codQuote = isDomestic ? pickLowestCourierQuote(couriers, true) : null

  const selected = input.cod && isDomestic ? codQuote : prepaidQuote

  return {
    serviceable: couriers.length > 0 && selected !== null,
    shippingLane: isDomestic ? 'india_domestic' as const : 'india_international' as const,
    shippingCharge: selected?.shippingCharge ?? 0,
    codCharges: input.cod && isDomestic ? (selected?.codCharges ?? 0) : 0,
    totalShippingCharge: selected?.totalShippingCharge ?? 0,
    estimatedDelivery: selected?.estimatedDelivery ?? null,
    courierCompanyId: selected?.courierCompanyId ?? null,
    courierName: selected?.courierName ?? null,
    codAvailable: isDomestic ? (codQuote !== null) : false,
    weightKg: input.weightKg,
    lengthCm: input.lengthCm ?? null,
    widthCm: input.widthCm ?? null,
    heightCm: input.heightCm ?? null,
  } satisfies ShippingQuote
}

export async function shiprocketRequest(
  settings: ShippingProviderSettings,
  token: string,
  path: string,
  init: RequestInit,
) {
  const response = await fetch(`${settings.api_base_url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload?.message === 'string' ? payload.message : `Shiprocket request failed (${response.status}).`)
  }

  return payload
}

export function trackPath(settings: ShippingProviderSettings, awbCode: string) {
  return settings.track_awb_path_template.replace('{awb_code}', encodeURIComponent(awbCode))
}

export async function createAuthedSupabase(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('Missing Supabase environment configuration.')
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const serviceClient = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await userClient.auth.getUser()
  if (error || !data.user) {
    throw new Error('Unauthorized')
  }

  return { user: data.user, userClient, serviceClient }
}

export async function assertAdmin(serviceClient: SupabaseClient, userId: string) {
  const { data: roleRow, error } = await serviceClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!roleRow) throw new Error('Admin access required.')
}

export async function assertSellerOwnsOrder(serviceClient: SupabaseClient, orderId: number, userId: string) {
  const { data, error } = await serviceClient
    .from('marketplace_orders')
    .select('seller_user_id')
    .eq('id', orderId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data || data.seller_user_id !== userId) throw new Error('Order not found.')
}
