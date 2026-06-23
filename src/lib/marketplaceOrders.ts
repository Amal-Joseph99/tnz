import { supabase } from './supabase'
import type { ShippingQuote } from './shiprocketShipping'
import { getStorefrontProductImageUrl } from './storefrontCatalog'

export type MarketplaceOrderStatus =
  | 'awaiting_payment'
  | 'pending_seller_acceptance'
  | 'seller_rejected'
  | 'seller_accepted'
  | 'shiprocket_pending'
  | 'shiprocket_created'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type MarketplaceOrderRow = {
  id: number
  order_number: string
  buyer_user_id: string
  seller_user_id: string
  status: MarketplaceOrderStatus
  payment_method: 'prepaid' | 'cod'
  payment_status?: 'not_required' | 'pending' | 'paid' | 'failed' | 'refunded'
  shipping_lane: 'india_domestic' | 'india_international'
  currency_code: string
  subtotal_amount: number
  shipping_amount: number
  cod_charges_amount: number
  tax_amount: number
  total_amount: number
  delivery_full_name: string
  delivery_phone: string
  delivery_email: string
  delivery_address_line1?: string
  delivery_address_line2?: string | null
  delivery_city: string
  delivery_state: string
  delivery_postcode: string
  delivery_country_iso2: string
  shipping_estimated_delivery: string | null
  shipping_courier_name: string | null
  shipping_courier_company_id: number | null
  seller_response_note?: string | null
  seller_responded_at?: string | null
  packed_at?: string | null
  paid_at?: string | null
  created_at: string
  marketplace_order_items?: Array<{
    product_id: number
    product_name: string
    sku: string
    quantity: number
    unit_price: number
    line_total: number
  }>
  marketplace_order_shipments?: Array<{
    shiprocket_order_id: number | null
    shiprocket_shipment_id: number | null
    awb_code: string | null
    label_url: string | null
    manifest_url: string | null
    tracking_payload: unknown
  }> | {
    shiprocket_order_id: number | null
    shiprocket_shipment_id: number | null
    awb_code: string | null
    label_url: string | null
    manifest_url: string | null
    tracking_payload: unknown
  } | null
}

export type CheckoutDelivery = {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postcode: string
  countryIso2: string
}

export type CheckoutCartItem = {
  productId: number
  sellerUserId: string
  sku: string
  title: string
  quantity: number
  unitPrice: number
  variantId?: string
}

type MutationResult = { ok: true } | { ok: false; message: string }

const orderSelect = `
  id,
  order_number,
  buyer_user_id,
  seller_user_id,
  status,
  payment_method,
  payment_status,
  paid_at,
  shipping_lane,
  currency_code,
  subtotal_amount,
  shipping_amount,
  cod_charges_amount,
  tax_amount,
  total_amount,
  delivery_full_name,
  delivery_phone,
  delivery_email,
  delivery_address_line1,
  delivery_address_line2,
  delivery_city,
  delivery_state,
  delivery_postcode,
  delivery_country_iso2,
  shipping_estimated_delivery,
  shipping_courier_name,
  shipping_courier_company_id,
  seller_response_note,
  seller_responded_at,
  packed_at,
  created_at,
  marketplace_order_items (product_id, product_name, sku, quantity, unit_price, line_total),
  marketplace_order_shipments (shiprocket_order_id, shiprocket_shipment_id, awb_code, label_url, manifest_url, tracking_payload)
`

export function isConfirmedSellerOrder(order: Pick<MarketplaceOrderRow, 'status' | 'payment_method' | 'payment_status'>) {
  return isConfirmedOrder(order)
}

export function isConfirmedOrder(order: Pick<MarketplaceOrderRow, 'status' | 'payment_method' | 'payment_status'>) {
  if (order.status === 'awaiting_payment' || order.status === 'cancelled') {
    return false
  }

  if (order.payment_method === 'cod') {
    return true
  }

  return order.payment_status === 'paid'
}

export async function createMarketplaceOrder(input: {
  sellerUserId: string
  paymentMethod: 'prepaid' | 'cod'
  currencyCode: string
  subtotal: number
  shippingAmount: number
  codChargesAmount: number
  totalAmount: number
  delivery: CheckoutDelivery
  shippingQuote: ShippingQuote
  items: CheckoutCartItem[]
}) {
  if (!supabase) {
    return { ok: false as const, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('create_marketplace_order', {
    p_seller_user_id: input.sellerUserId,
    p_payment_method: input.paymentMethod,
    p_currency_code: input.currencyCode,
    p_subtotal: input.subtotal,
    p_shipping_amount: input.shippingAmount,
    p_cod_charges_amount: input.codChargesAmount,
    p_tax_amount: 0,
    p_total_amount: input.totalAmount,
    p_delivery: {
      fullName: input.delivery.fullName,
      phone: input.delivery.phone,
      email: input.delivery.email,
      addressLine1: input.delivery.addressLine1,
      addressLine2: input.delivery.addressLine2,
      city: input.delivery.city,
      state: input.delivery.state,
      postcode: input.delivery.postcode,
      countryIso2: input.delivery.countryIso2,
    },
    p_shipping_quote: {
      weightKg: input.shippingQuote.weightKg,
      lengthCm: input.shippingQuote.lengthCm,
      widthCm: input.shippingQuote.widthCm,
      heightCm: input.shippingQuote.heightCm,
      courierCompanyId: input.shippingQuote.courierCompanyId,
      courierName: input.shippingQuote.courierName,
      estimatedDelivery: input.shippingQuote.estimatedDelivery,
      codAvailable: input.shippingQuote.codAvailable,
    },
    p_items: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? '',
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
    })),
  })

  if (error) {
    return { ok: false as const, message: error.message }
  }

  return {
    ok: true as const,
    orderId: Number(data.orderId),
    orderNumber: String(data.orderNumber),
    shippingLane: String(data.shippingLane),
  }
}

export async function fetchBuyerOrders(): Promise<MarketplaceOrderRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as MarketplaceOrderRow[]
}

export async function fetchSellerOrders(): Promise<MarketplaceOrderRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as MarketplaceOrderRow[]).filter(isConfirmedSellerOrder)
}

export async function fetchSellerOrder(orderId: number): Promise<MarketplaceOrderRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(orderSelect)
    .eq('id', orderId)
    .maybeSingle()

  if (error || !data) return null
  const order = data as MarketplaceOrderRow
  return isConfirmedSellerOrder(order) ? order : null
}

export async function fetchOrderProductThumbnails(productIds: number[]) {
  const uniqueIds = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))]
  const thumbnails = new Map<number, string>()
  if (!supabase || uniqueIds.length === 0) return thumbnails

  const { data, error } = await supabase
    .from('seller_product_media')
    .select('product_id, storage_path, sort_order')
    .in('product_id', uniqueIds)
    .eq('media_type', 'product_image')
    .order('sort_order', { ascending: true })

  if (error || !data) return thumbnails

  for (const row of data) {
    const productId = Number(row.product_id)
    if (!thumbnails.has(productId)) {
      thumbnails.set(productId, getStorefrontProductImageUrl(String(row.storage_path ?? '')))
    }
  }

  return thumbnails
}

export function getPrimaryOrderItem(order: MarketplaceOrderRow) {
  return order.marketplace_order_items?.[0] ?? null
}

export function getOrderThumbnailProductId(order: MarketplaceOrderRow) {
  return getPrimaryOrderItem(order)?.product_id ?? null
}

export async function fetchAdminOrders(): Promise<MarketplaceOrderRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as MarketplaceOrderRow[]).filter(isConfirmedOrder)
}

export async function fetchAdminOrder(orderId: number): Promise<MarketplaceOrderRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(orderSelect)
    .eq('id', orderId)
    .maybeSingle()

  if (error || !data) return null
  const order = data as MarketplaceOrderRow
  return isConfirmedOrder(order) ? order : null
}

export async function sellerRespondToOrder(orderId: number, accept: boolean, note?: string): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('seller_respond_marketplace_order', {
    p_order_id: orderId,
    p_accept: accept,
    p_note: note ?? null,
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function sellerMarkOrderPacked(orderId: number): Promise<MutationResult> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const { error } = await supabase.rpc('seller_mark_order_packed', { p_order_id: orderId })
  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export function formatOrderStatus(status: MarketplaceOrderStatus) {
  const labels: Record<MarketplaceOrderStatus, string> = {
    awaiting_payment: 'Awaiting payment',
    pending_seller_acceptance: 'Pending seller acceptance',
    seller_rejected: 'Rejected',
    seller_accepted: 'Accepted',
    shiprocket_pending: 'Ready for dispatch',
    shiprocket_created: 'Shipment created',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  return labels[status] ?? status.replaceAll('_', ' ')
}

export function formatPaymentMethod(method: MarketplaceOrderRow['payment_method']) {
  return method === 'cod' ? 'Cash on delivery' : 'Paid online'
}

export function getShipmentRow(order: MarketplaceOrderRow) {
  if (!order.marketplace_order_shipments) return null
  return Array.isArray(order.marketplace_order_shipments)
    ? order.marketplace_order_shipments[0] ?? null
    : order.marketplace_order_shipments
}
