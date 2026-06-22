import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../lib/checkout'
import { fetchDialogMessage } from '../lib/appDialogs'
import { useAuth } from '../context/AuthContext'
import { useCartFly } from '../context/CartFlyContext'
import { useCheckout } from '../context/CheckoutContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'

type AddToCartOptions = {
  item: CartItem
  source?: HTMLElement | null
}

export function useAddToCart() {
  const { isSignedIn, accountType } = useAuth()
  const { confirmAction } = useConfirmDialog()
  const { addItem } = useCheckout()
  const { flyToCart } = useCartFly()
  const navigate = useNavigate()

  const requestAddToCart = async () => {
    if (isSignedIn && accountType === 'buyer') {
      return true
    }

    const confirmed = await confirmAction('guest_add_to_cart')
    if (!confirmed) {
      return false
    }

    const dialog = await fetchDialogMessage('guest_add_to_cart')
    navigate(dialog?.redirectPath ?? '/buyer/signup')
    return false
  }

  const addToCart = async ({ item, source }: AddToCartOptions) => {
    const allowed = await requestAddToCart()
    if (!allowed) {
      return false
    }

    addItem(item)

    if (source) {
      flyToCart({ source, imageUrl: item.image })
    }

    return true
  }

  return { requestAddToCart, addToCart }
}
