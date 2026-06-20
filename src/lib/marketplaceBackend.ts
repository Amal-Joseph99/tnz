import { supabase } from './supabase'

export type BuyerProfile = {
  user_id: string
  full_name: string
  phone: string | null
  date_of_birth: string | null
}

export type BuyerAddress = {
  id: number
  user_id: string
  label: string
  full_name: string
  phone: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  postcode: string
  country_iso2: string
  is_default: boolean
}

export type AdminBuyerRow = {
  user_id: string
  full_name: string
  phone: string | null
  created_at: string
  order_count: number
}

export type AdminSellerRow = {
  user_id: string
  business_name: string
  iso_alpha2: string
  kyc_status: string
  created_at: string
  approved_product_count: number
}

export async function submitContactMessage(input: {
  fullName: string
  email: string
  topicKey: string
  message: string
}) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('submit_contact_message', {
    p_full_name: input.fullName,
    p_email: input.email,
    p_topic_key: input.topicKey,
    p_message: input.message,
  })

  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const, messageId: Number(data) }
}

export async function checkReturnEligibility(orderNumber: string, email: string) {
  if (!supabase) return { eligible: false, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('check_return_eligibility', {
    p_order_number: orderNumber,
    p_email: email,
  })

  if (error) return { eligible: false, message: error.message }
  return data as {
    eligible: boolean
    message?: string
    orderId?: number
    orderNumber?: string
    requiresLogin?: boolean
  }
}

export async function createReturnRequest(orderId: number, reason: string) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('create_return_request', {
    p_order_id: orderId,
    p_reason: reason,
  })

  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const, returnRequestId: Number((data as { returnRequestId: number }).returnRequestId) }
}

export async function fetchBuyerAccount() {
  if (!supabase) return { profile: null, addresses: [] as BuyerAddress[] }

  const { data, error } = await supabase.rpc('get_buyer_account')
  if (error || !data) return { profile: null, addresses: [] as BuyerAddress[] }

  const payload = data as { profile: BuyerProfile | null; addresses: BuyerAddress[] }
  return {
    profile: payload.profile,
    addresses: Array.isArray(payload.addresses) ? payload.addresses : [],
  }
}

export async function saveBuyerProfile(input: {
  fullName: string
  phone?: string
  dateOfBirth?: string
}) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('upsert_buyer_profile', {
    p_full_name: input.fullName,
    p_phone: input.phone ?? null,
    p_date_of_birth: input.dateOfBirth || null,
  })

  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function saveBuyerAddress(input: {
  id?: number
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postcode: string
  countryIso2: string
  isDefault?: boolean
}) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('upsert_buyer_address', {
    p_payload: {
      id: input.id ? String(input.id) : '',
      label: input.label,
      fullName: input.fullName,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? '',
      city: input.city,
      state: input.state,
      postcode: input.postcode,
      countryIso2: input.countryIso2,
      isDefault: input.isDefault ?? false,
    },
  })

  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function fetchAdminBuyers(): Promise<AdminBuyerRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_admin_buyers')
  if (error || !Array.isArray(data)) return []
  return data as AdminBuyerRow[]
}

export async function fetchAdminSellers(): Promise<AdminSellerRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_admin_sellers')
  if (error || !Array.isArray(data)) return []
  return data as AdminSellerRow[]
}
