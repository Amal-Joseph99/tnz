import { useNavigate } from 'react-router-dom'
import { fetchDialogMessage } from '../lib/appDialogs'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'

export function useAddToCart() {
  const { isSignedIn, accountType } = useAuth()
  const { confirmAction } = useConfirmDialog()
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

  return { requestAddToCart }
}
