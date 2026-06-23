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
import { normalizeCartItem } from '../lib/checkout'
import type { CheckoutDelivery } from '../lib/marketplaceOrders'
import type { ShippingQuote } from '../lib/shiprocketShipping'

const STORAGE_KEY = 'agtrenz_checkout_v2'

type StoredCheckout = {
  items: CartItem[]
  heldItems: CartItem[]
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
  updateQuantity: (lineId: string, quantity: number) => void
  removeItem: (lineId: string) => void
  removeItems: (lineIds: string[]) => void
  beginCheckout: (lineIds: string[]) => void
  restoreHeldCartItems: () => void
  clearCart: () => void
  setDelivery: (delivery: CheckoutDelivery) => void
  setPaymentMethod: (method: CheckoutPaymentMethod) => void
  setShippingQuote: (quote: ShippingQuote | null) => void
  addPlacedOrderNumber: (orderNumber: string) => void
}

const defaultState: StoredCheckout = {
  items: [],
  heldItems: [],
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
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item) => normalizeCartItem(item as Partial<CartItem> & { productId: number }))
        : [],
      heldItems: Array.isArray(parsed.heldItems)
        ? parsed.heldItems.map((item) => normalizeCartItem(item as Partial<CartItem> & { productId: number }))
        : [],
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
    const normalized = normalizeCartItem(item)

    setState((current) => {
      const existing = current.items.find((row) => row.id === normalized.id)
      if (existing) {
        return {
          ...current,
          shippingQuote: null,
          items: current.items.map((row) =>
            row.id === normalized.id
              ? {
                  ...normalized,
                  quantity: row.quantity + normalized.quantity,
                }
              : row,
          ),
        }
      }

      if (current.items.length > 0 && current.items[0]?.sellerUserId !== normalized.sellerUserId) {
        return {
          ...current,
          shippingQuote: null,
          items: [normalized],
        }
      }

      return {
        ...current,
        shippingQuote: null,
        items: [...current.items, normalized],
      }
    })
  }, [])

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setState((current) => ({
      ...current,
      shippingQuote: null,
      items: current.items
        .map((row) => (row.id === lineId ? { ...row, quantity } : row))
        .filter((row) => row.quantity > 0),
    }))
  }, [])

  const removeItem = useCallback((lineId: string) => {
    setState((current) => ({
      ...current,
      shippingQuote: null,
      items: current.items.filter((row) => row.id !== lineId),
      heldItems: current.heldItems.filter((row) => row.id !== lineId),
    }))
  }, [])

  const removeItems = useCallback((lineIds: string[]) => {
    const idSet = new Set(lineIds)
    setState((current) => ({
      ...current,
      shippingQuote: null,
      items: current.items.filter((row) => !idSet.has(row.id)),
      heldItems: current.heldItems.filter((row) => !idSet.has(row.id)),
    }))
  }, [])

  const beginCheckout = useCallback((lineIds: string[]) => {
    setState((current) => {
      const idSet = new Set(lineIds)
      const selected = current.items.filter((row) => idSet.has(row.id))
      const held = current.items.filter((row) => !idSet.has(row.id))

      if (selected.length === 0) return current

      if (held.length === 0) {
        return {
          ...current,
          shippingQuote: null,
        }
      }

      return {
        ...current,
        items: selected,
        heldItems: [...current.heldItems, ...held],
        shippingQuote: null,
      }
    })
  }, [])

  const restoreHeldCartItems = useCallback(() => {
    setState((current) => {
      if (current.heldItems.length === 0) return current

      return {
        ...current,
        items: [...current.items, ...current.heldItems],
        heldItems: [],
        shippingQuote: null,
      }
    })
  }, [])

  const clearCart = useCallback(() => {
    setState((current) => ({
      ...current,
      items: current.heldItems,
      heldItems: [],
      shippingQuote: null,
    }))
  }, [])

  const setDelivery = useCallback((delivery: CheckoutDelivery) => {
    setState((current) => ({ ...current, delivery }))
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
    removeItems,
    beginCheckout,
    restoreHeldCartItems,
    clearCart,
    setDelivery,
    setPaymentMethod,
    setShippingQuote,
    addPlacedOrderNumber,
  }), [state, addItem, updateQuantity, removeItem, removeItems, beginCheckout, restoreHeldCartItems, clearCart, setDelivery, setPaymentMethod, setShippingQuote, addPlacedOrderNumber])

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider')
  }
  return context
}
