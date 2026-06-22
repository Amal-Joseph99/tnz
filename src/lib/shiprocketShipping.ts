import { supabase } from './supabase'

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

type ServiceabilityItem = {
  productId: number
  quantity: number
}

type ServiceabilityResponse =
  | { serviceable: true; quote: ShippingQuote }
  | { serviceable: false; shippingLane?: string; message: string }

async function invokeShiprocketFunction<T>(functionName: string, body: unknown): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body: body as Record<string, unknown> })
  if (error) {
    throw new Error(error.message)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string') {
    throw new Error((data as { error: string }).error)
  }

  return data as T
}

export async function fetchShiprocketServiceability(input: {
  sellerUserId: string
  deliveryPostcode?: string
  deliveryCountryIso2: string
  paymentMethod: 'prepaid' | 'cod'
  items: ServiceabilityItem[]
}): Promise<ServiceabilityResponse> {
  return invokeShiprocketFunction<ServiceabilityResponse>('shiprocket-serviceability', input)
}

export async function trackShiprocketOrder(input: { orderId?: number; orderNumber?: string; email?: string }) {
  return invokeShiprocketFunction<{
    ok: boolean
    orderNumber: string
    status: string
    awbCode?: string
    tracking?: unknown
    message?: string
  }>('shiprocket-track', input)
}

export async function adminPushOrderToShiprocket(orderId: number) {
  return invokeShiprocketFunction<{
    ok: boolean
    shiprocketOrderId: number
    shiprocketShipmentId: number
    awbCode: string
  }>('shiprocket-admin-push-order', { orderId })
}

export async function sellerFetchShipmentDocuments(orderId: number) {
  return invokeShiprocketFunction<{
    ok: boolean
    labelUrl: string | null
    manifestUrl: string | null
  }>('shiprocket-seller-documents', { orderId })
}

export async function adminSyncWarehousePickup(userId: string, provider: string) {
  return invokeShiprocketFunction<{
    ok: boolean
    pickupLocationName: string
  }>('shiprocket-sync-pickup', { userId, provider })
}

export async function fetchCheckoutCountries() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('countries')
    .select('country_name, iso_alpha2')
    .order('country_name', { ascending: true })

  if (error || !data) return []
  return data.map((row) => ({
    countryName: row.country_name as string,
    isoAlpha2: row.iso_alpha2 as string,
  }))
}
