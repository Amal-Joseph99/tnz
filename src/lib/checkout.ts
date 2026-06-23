export function buildCartLineId(productId: number, variantId: string) {
  return `${productId}:${variantId.trim() || 'default'}`
}

export type CartItem = {
  id: string
  productId: number
  sellerUserId: string
  sku: string
  title: string
  brand: string
  variantId: string
  variantSize?: string
  variantColor?: string
  price: number
  originalPrice?: number
  listingCurrencyCode: string
  image: string
  quantity: number
}

export function normalizeCartItem(raw: Partial<CartItem> & { productId: number }): CartItem {
  const productId = Number(raw.productId)
  const variantId = String(raw.variantId ?? 'default')
  const id = raw.id?.includes(':') ? raw.id : buildCartLineId(productId, variantId)

  return {
    id,
    productId,
    sellerUserId: String(raw.sellerUserId ?? ''),
    sku: String(raw.sku ?? ''),
    title: String(raw.title ?? ''),
    brand: String(raw.brand ?? ''),
    variantId,
    variantSize: raw.variantSize,
    variantColor: raw.variantColor,
    price: Number(raw.price) || 0,
    originalPrice: raw.originalPrice,
    listingCurrencyCode: raw.listingCurrencyCode || 'INR',
    image: String(raw.image ?? ''),
    quantity: Math.max(1, Number(raw.quantity) || 1),
  }
}

export const defaultCartItems: CartItem[] = []

export function getCartTotals(
  items: CartItem[],
  shippingQuote?: { totalShippingCharge: number } | null,
  options?: {
    toDisplayAmount?: (price: number, listingCurrencyCode: string) => number
    shippingCurrencyCode?: string
  },
) {
  const toDisplay = options?.toDisplayAmount ?? ((price: number) => price)
  const shippingCurrency = options?.shippingCurrencyCode ?? 'INR'

  const subtotal = items.reduce((sum, item) => {
    const listingCurrency = item.listingCurrencyCode || 'INR'
    return sum + toDisplay(item.price, listingCurrency) * item.quantity
  }, 0)
  const shipping = shippingQuote
    ? toDisplay(shippingQuote.totalShippingCharge, shippingCurrency)
    : 0
  const total = subtotal + shipping
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return { subtotal, shipping, total, itemCount }
}

export const checkoutSteps = [
  { id: 'address', label: 'Address', path: '/checkout' },
  { id: 'review', label: 'Review', path: '/checkout/review' },
  { id: 'status', label: 'Status', path: '/checkout/status' },
] as const
