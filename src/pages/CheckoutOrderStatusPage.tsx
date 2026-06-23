import { Link, useLocation } from 'react-router-dom'
import { OrderResultScreen } from '../components/OrderResultScreen'
import { useCheckout } from '../context/CheckoutContext'

type OrderStatusState = {
  status?: 'success' | 'failed'
  orderNumber?: string
  paymentMethod?: 'razorpay' | 'cod'
  estimatedDelivery?: string | null
  message?: string
  clearCart?: boolean
}

export function CheckoutOrderStatusPage() {
  const location = useLocation()
  const { placedOrderNumbers } = useCheckout()
  const state = (location.state as OrderStatusState | null) ?? {}
  const queryOrderNumber = new URLSearchParams(location.search).get('orderNumber')?.trim() ?? ''
  const recentOrderNumber = placedOrderNumbers[placedOrderNumbers.length - 1]?.trim() ?? ''
  const orderNumber = state.orderNumber?.trim() || queryOrderNumber || recentOrderNumber
  const hasExplicitStatus = state.status === 'success' || state.status === 'failed'
  const isFailed = state.status === 'failed'
  const isSuccess = state.status === 'success' || (!hasExplicitStatus && Boolean(orderNumber))
  const paidOnline = state.paymentMethod === 'razorpay'
  const estimatedDelivery = state.estimatedDelivery ?? null

  if (!isSuccess && !isFailed) {
    return (
      <OrderResultScreen
        variant="failed"
        title="Session unavailable"
        message="We could not restore this checkout session. Open Orders to check your latest status, or try checkout again."
      >
        <div className="order-result__actions">
          <Link to="/checkout/review" className="order-result__btn order-result__btn--primary">Try again</Link>
          <Link to="/orders" className="order-result__btn order-result__btn--ghost">View orders</Link>
        </div>
      </OrderResultScreen>
    )
  }

  if (isFailed) {
    return (
      <OrderResultScreen
        variant="failed"
        title="Payment failed"
        message={state.message ?? 'Something went wrong with your payment. Please try again.'}
      >
        <div className="order-result__actions">
          <Link to="/checkout/review" className="order-result__btn order-result__btn--primary">Try again</Link>
          <Link to="/cart" className="order-result__btn order-result__btn--ghost">Back to cart</Link>
        </div>
      </OrderResultScreen>
    )
  }

  const successMessage = paidOnline
    ? 'Order has been placed successfully.'
    : 'Your cash on delivery order has been placed successfully.'

  return (
    <OrderResultScreen
      variant="success"
      title="Congratulations!"
      message={successMessage}
    >
      {(orderNumber || estimatedDelivery) && (
        <div className="order-result__meta">
          {orderNumber && (
            <p>
              <span>Order ID</span>
              <strong>{orderNumber}</strong>
            </p>
          )}
          {estimatedDelivery && (
            <p>
              <span>Expected delivery</span>
              <strong>{estimatedDelivery}</strong>
            </p>
          )}
        </div>
      )}

      <div className="order-result__actions">
        <Link to="/" className="order-result__btn order-result__btn--primary">Continue shopping</Link>
        {orderNumber && (
          <Link
            to={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}
            className="order-result__btn order-result__btn--ghost"
          >
            Track order
          </Link>
        )}
        <Link to="/orders" className="order-result__link">View all orders</Link>
      </div>
    </OrderResultScreen>
  )
}
