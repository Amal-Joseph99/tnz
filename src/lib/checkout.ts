export type CartItem = {
  id: string
  productId: number
  sellerUserId: string
  sku: string
  title: string
  brand: string
  price: number
  originalPrice?: number
  listingCurrencyCode: string
  image: string
  quantity: number
  variantId?: string
}

export const defaultCartItems: CartItem[] = []

export function getCartTotals(
  items: CartItem[],
  shippingQuote?: { totalShippingCharge: number } | null,
  options?: {
    taxRate?: number
    toDisplayAmount?: (price: number, listingCurrencyCode: string) => number
  },
) {
  const taxRate = options?.taxRate ?? 0.05
  const toDisplay = options?.toDisplayAmount ?? ((price: number) => price)

  const subtotal = items.reduce((sum, item) => {
    const listingCurrency = item.listingCurrencyCode || 'INR'
    return sum + toDisplay(item.price, listingCurrency) * item.quantity
  }, 0)
  const shipping = shippingQuote?.totalShippingCharge ?? 0
  const tax = subtotal * taxRate
  const total = subtotal + shipping + tax
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return { subtotal, shipping, tax, total, itemCount }
}

export const checkoutSteps = [
  { id: 'address', label: 'Address', path: '/checkout' },
  { id: 'payment', label: 'Payment', path: '/checkout/payment' },
  { id: 'review', label: 'Review', path: '/checkout/review' },
  { id: 'confirmation', label: 'Confirmation', path: '/checkout/confirmation' },
] as const
