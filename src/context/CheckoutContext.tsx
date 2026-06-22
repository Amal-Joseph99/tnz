import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem } from '../lib/checkout'
import type { CheckoutDelivery } from '../lib/marketplaceOrders'
import type { ShippingQuote } from '../lib/shiprocketShipping'

const STORAGE_KEY = 'agtrenz_checkout_v1'

type StoredCheckout = {
  items: CartItem[]
  delivery: CheckoutDelivery | null
  paymentMethod: 'razorpay' | 'cod'
  shippingQuote: ShippingQuote | null
  placedOrderNumbers: string[]
}

type CheckoutPaymentMethod = 'razorpay' | 'cod'

type CheckoutContextValue = {
  items: CartItem[]
  delivery: CheckoutDelivery | null
  paymentMethod: CheckoutPaymentMethod
  shippingQuote: ShippingQuote | null
  placedOrderNumbers: string[]
  itemCount: number
  addItem: (item: CartItem) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  setDelivery: (delivery: CheckoutDelivery) => void
  setPaymentMethod: (method: CheckoutPaymentMethod) => void
  setShippingQuote: (quote: ShippingQuote | null) => void
  addPlacedOrderNumber: (orderNumber: string) => void
}

const defaultState: StoredCheckout = {
  items: [],
  delivery: null,
  paymentMethod: 'razorpay',
  shippingQuote: null,
  placedOrderNumbers: [],
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

function readStorage(): StoredCheckout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as StoredCheckout
    const paymentMethod = parsed.paymentMethod === 'cod' ? 'cod' : 'razorpay'

    return {
      ...defaultState,
      ...parsed,
      paymentMethod,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      placedOrderNumbers: Array.isArray(parsed.placedOrderNumbers) ? parsed.placedOrderNumbers : [],
    }
  } catch {
    return defaultState
  }
}

function writeStorage(state: StoredCheckout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredCheckout>(() => readStorage())

  useEffect(() => {
    writeStorage(state)
  }, [state])

  const addItem = useCallback((item: CartItem) => {
    setState((current) => {
      const existing = current.items.find((row) => row.productId === item.productId)
      if (existing) {
        return {
          ...current,
          shippingQuote: null,
          items: current.items.map((row) =>
            row.productId === item.productId
              ? { ...row, quantity: row.quantity + item.quantity }
              : row,
          ),
        }
      }

      if (current.items.length > 0 && current.items[0]?.sellerUserId !== item.sellerUserId) {
        return {
          ...current,
          shippingQuote: null,
          items: [item],
        }
      }

      return {
        ...current,
        shippingQuote: null,
        items: [...current.items, item],
      }
    })
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setState((current) => ({
      ...current,
      shippingQuote: null,
      items: current.items
        .map((row) => (row.productId === productId ? { ...row, quantity } : row))
        .filter((row) => row.quantity > 0),
    }))
  }, [])

  const removeItem = useCallback((productId: number) => {
    setState((current) => ({
      ...current,
      shippingQuote: null,
      items: current.items.filter((row) => row.productId !== productId),
    }))
  }, [])

  const clearCart = useCallback(() => {
    setState((current) => ({
      ...current,
      items: [],
      shippingQuote: null,
    }))
  }, [])

  const setDelivery = useCallback((delivery: CheckoutDelivery) => {
    setState((current) => ({ ...current, delivery, shippingQuote: null }))
  }, [])

  const setPaymentMethod = useCallback((paymentMethod: CheckoutPaymentMethod) => {
    setState((current) => ({ ...current, paymentMethod, shippingQuote: null }))
  }, [])

  const setShippingQuote = useCallback((shippingQuote: ShippingQuote | null) => {
    setState((current) => ({ ...current, shippingQuote }))
  }, [])

  const addPlacedOrderNumber = useCallback((orderNumber: string) => {
    setState((current) => ({
      ...current,
      placedOrderNumbers: [...current.placedOrderNumbers, orderNumber],
    }))
  }, [])

  const value = useMemo<CheckoutContextValue>(() => ({
    items: state.items,
    delivery: state.delivery,
    paymentMethod: state.paymentMethod,
    shippingQuote: state.shippingQuote,
    placedOrderNumbers: state.placedOrderNumbers,
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setDelivery,
    setPaymentMethod,
    setShippingQuote,
    addPlacedOrderNumber,
  }), [state, addItem, updateQuantity, removeItem, clearCart, setDelivery, setPaymentMethod, setShippingQuote, addPlacedOrderNumber])

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider')
  }
  return context
}
