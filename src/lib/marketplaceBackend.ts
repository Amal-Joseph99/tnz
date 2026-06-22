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

export async function setBuyerAddressDefault(address: BuyerAddress) {
  return saveBuyerAddress({
    id: address.id,
    label: address.label,
    fullName: address.full_name,
    phone: address.phone,
    addressLine1: address.address_line1,
    addressLine2: address.address_line2 ?? undefined,
    city: address.city,
    state: address.state,
    postcode: address.postcode,
    countryIso2: address.country_iso2,
    isDefault: true,
  })
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

export type AppNotification = {
  id: number
  audience: string
  category: string
  title: string
  body: string
  link_path: string | null
  is_read: boolean
  created_at: string
}

export type SellerLedgerEntry = {
  id: number
  entry_type: string
  amount: number
  currency_code: string
  status: string
  available_at: string | null
  description: string | null
  created_at: string
  order_id: number | null
}

export type AdminReturnRequest = {
  id: number
  order_id: number
  order_number: string
  reason: string
  status: string
  admin_note: string | null
  payment_refund_status: string
  total_amount: number
  currency_code: string
  payment_method: string
  created_at: string
}

export type SupportRequestRow = {
  id: number
  portal_key: string
  user_id: string | null
  topic_key: string
  message: string
  status: string
  created_at: string
  source: string
}

export type PlatformSettings = {
  checkout_tax_rate: number
  return_window_days: number
  stale_payment_hours: number
  commission_percent: number
  settlement_days: number
  ops_email: string | null
  notify_kyc_submissions: boolean
  notify_order_disputes: boolean
  require_seller_kyc_approval: boolean
  require_product_approval: boolean
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_user_notifications', { p_limit: 50 })
  if (error || !Array.isArray(data)) return []
  return data as AppNotification[]
}

export async function markAllNotificationsRead() {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }
  const { error } = await supabase.rpc('mark_notifications_read', { p_notification_ids: null })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function fetchSellerWalletSummary() {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_seller_wallet_summary')
  if (error || !data) return null
  return data as {
    currencyCode: string
    availableBalance: number
    pendingBalance: number
    totalFees: number
  }
}

export async function fetchSellerLedger(): Promise<SellerLedgerEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_seller_ledger_entries', { p_limit: 50 })
  if (error || !Array.isArray(data)) return []
  return data as SellerLedgerEntry[]
}

export async function requestSellerPayout(amount: number) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }
  const { error } = await supabase.rpc('request_seller_payout', { p_amount: amount })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function subscribeNewsletter(email: string) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }
  const { error } = await supabase.rpc('subscribe_newsletter', { p_email: email })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function fetchAdminPlatformSettings(): Promise<PlatformSettings | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_admin_platform_settings')
  if (error || !data) return null
  return data as PlatformSettings
}

export async function saveAdminPlatformSettings(payload: Partial<PlatformSettings>) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }
  const { error } = await supabase.rpc('update_admin_platform_settings', { p_payload: payload })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export async function fetchAdminReturnRequests(): Promise<AdminReturnRequest[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_admin_return_requests')
  if (error || !Array.isArray(data)) return []
  return data as AdminReturnRequest[]
}

export async function fetchAdminSupportRequests(): Promise<SupportRequestRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('list_admin_support_requests')
  if (error || !Array.isArray(data)) return []
  return data as SupportRequestRow[]
}

export async function adminReviewReturn(returnRequestId: number, approve: boolean, adminNote?: string) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }
  const { data, error } = await supabase.functions.invoke('admin-review-return', {
    body: { returnRequestId, approve, adminNote },
  })
  if (error) return { ok: false as const, message: error.message }
  if (data && typeof data === 'object' && 'error' in data) {
    return { ok: false as const, message: String((data as { error: string }).error) }
  }
  return { ok: true as const, data }
}

export type AccountDeletionReason = {
  reasonKey: string
  label: string
  requiresCustomText: boolean
}

export async function fetchAccountDeletionReasons(): Promise<AccountDeletionReason[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_account_deletion_reasons')
  if (error || !Array.isArray(data)) return []
  return data as AccountDeletionReason[]
}

export async function prepareBuyerAccountDeletion(input: {
  reasonKey: string
  customReason?: string
  acceptedTerms: boolean
}) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { data, error } = await supabase.rpc('prepare_buyer_account_deletion', {
    p_reason_key: input.reasonKey,
    p_custom_reason: input.customReason ?? null,
    p_accepted_terms: input.acceptedTerms,
  })

  if (error) return { ok: false as const, message: error.message }

  const payload = data as { ok?: boolean; requestId?: number }
  if (!payload.requestId) {
    return { ok: false as const, message: 'Could not start account deletion.' }
  }

  return { ok: true as const, requestId: payload.requestId }
}

export async function completeBuyerAccountDeletion(requestId: number) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('complete_buyer_account_deletion', {
    p_request_id: requestId,
  })

  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}
