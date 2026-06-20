export type CartItem = {
  id: string
  productId: number
  sellerUserId: string
  sku: string
  title: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  variantId?: number
}

export const defaultCartItems: CartItem[] = []

export function getCartTotals(
  items: CartItem[],
  shippingQuote?: { totalShippingCharge: number } | null,
  taxRate = 0.05,
) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
