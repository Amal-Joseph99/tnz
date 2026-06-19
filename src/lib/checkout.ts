export type CartItem = {
  id: string
  title: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
}

export const defaultCartItems: CartItem[] = []

export function getCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 4.99
  const tax = subtotal * 0.05
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
