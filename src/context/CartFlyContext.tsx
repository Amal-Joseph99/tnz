import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type FlyPayload = {
  source: HTMLElement
  imageUrl: string
}

type FlyingItem = {
  id: number
  imageUrl: string
  startX: number
  startY: number
  endX: number
  endY: number
  size: number
  active: boolean
}

type CartFlyContextValue = {
  flyToCart: (payload: FlyPayload) => void
  cartBump: boolean
}

const CartFlyContext = createContext<CartFlyContextValue | null>(null)

const FLY_SIZE = 48
const FLY_DURATION_MS = 700

export function CartFlyProvider({ children }: { children: ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])
  const [cartBump, setCartBump] = useState(false)

  const flyToCart = useCallback(({ source, imageUrl }: FlyPayload) => {
    const cartTarget = document.getElementById('header-cart-target')
    if (!cartTarget) return

    const sourceRect = source.getBoundingClientRect()
    const cartRect = cartTarget.getBoundingClientRect()
    const id = Date.now() + Math.random()

    const startX = sourceRect.left + sourceRect.width / 2 - FLY_SIZE / 2
    const startY = sourceRect.top + sourceRect.height / 2 - FLY_SIZE / 2
    const endX = cartRect.left + cartRect.width / 2 - FLY_SIZE / 2
    const endY = cartRect.top + cartRect.height / 2 - FLY_SIZE / 2

    const item: FlyingItem = {
      id,
      imageUrl,
      startX,
      startY,
      endX,
      endY,
      size: FLY_SIZE,
      active: false,
    }

    setFlyingItems((current) => [...current, item])

    window.requestAnimationFrame(() => {
      setFlyingItems((current) =>
        current.map((row) => (row.id === id ? { ...row, active: true } : row)),
      )
    })

    window.setTimeout(() => {
      setFlyingItems((current) => current.filter((row) => row.id !== id))
      setCartBump(true)
      window.setTimeout(() => setCartBump(false), 450)
    }, FLY_DURATION_MS)
  }, [])

  const value = useMemo(() => ({ flyToCart, cartBump }), [flyToCart, cartBump])

  return (
    <CartFlyContext.Provider value={value}>
      {children}
      <div className="cart-fly-layer" aria-hidden="true">
        {flyingItems.map((item) => (
          <img
            key={item.id}
            src={item.imageUrl}
            alt=""
            className={`cart-fly-item${item.active ? ' cart-fly-item--active' : ''}`}
            style={{
              width: item.size,
              height: item.size,
              transform: item.active
                ? `translate(${item.endX}px, ${item.endY}px) scale(0.35)`
                : `translate(${item.startX}px, ${item.startY}px) scale(1)`,
              opacity: item.active ? 0.15 : 1,
            }}
          />
        ))}
      </div>
    </CartFlyContext.Provider>
  )
}

export function useCartFly() {
  const context = useContext(CartFlyContext)
  if (!context) {
    throw new Error('useCartFly must be used within CartFlyProvider')
  }
  return context
}
