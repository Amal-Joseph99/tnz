import { supabase } from './supabase'

export type SellerWalletSummary = {
  currencyCode: string
  unsettledBalance: number
  availableToWithdraw: number
  totalSalesAmount: number
  totalWithdrawnAmount: number
  pendingSettlement: number
}

export type SellerWalletTransaction = {
  id: number
  transaction_date: string
  order_id: number
  order_number: string
  product_name: string
  sku: string
  buyer_name: string
  quantity: number
  unit_price: number
  gross_amount: number
  line_amount: number
  currency_code: string
  wallet_status: string
}

export async function fetchSellerWalletSummary(): Promise<SellerWalletSummary | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_seller_wallet_summary')
  if (error || !data) return null

  return {
    currencyCode: String(data.currencyCode ?? 'USD'),
    unsettledBalance: Number(data.unsettledBalance ?? 0),
    availableToWithdraw: Number(data.availableToWithdraw ?? 0),
    totalSalesAmount: Number(data.totalSalesAmount ?? 0),
    totalWithdrawnAmount: Number(data.totalWithdrawnAmount ?? 0),
    pendingSettlement: Number(data.pendingSettlement ?? 0),
  }
}

export async function fetchSellerWalletTransactions(): Promise<SellerWalletTransaction[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_seller_wallet_transactions', { p_limit: 200 })
  if (error || !Array.isArray(data)) return []

  return data as SellerWalletTransaction[]
}

export async function requestSellerWalletWithdrawal(amount: number) {
  if (!supabase) return { ok: false as const, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('request_seller_payout', { p_amount: amount })
  if (error) return { ok: false as const, message: error.message }
  return { ok: true as const }
}

export function formatWalletStatus(status: string) {
  switch (status) {
    case 'unsettled':
      return 'Unsettled'
    case 'pending_settlement':
      return 'Pending settlement'
    case 'available':
      return 'Available'
    case 'withdrawn':
      return 'Withdrawn'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status.replaceAll('_', ' ')
  }
}
