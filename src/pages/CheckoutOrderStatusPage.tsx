import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const { clearCart, placedOrderNumbers } = useCheckout()
  const state = (location.state as OrderStatusState | null) ?? {}
  const queryOrderNumber = new URLSearchParams(location.search).get('orderNumber')?.trim() ?? ''
  const recentOrderNumber = placedOrderNumbers[placedOrderNumbers.length - 1]?.trim() ?? ''
  const orderNumber = state.orderNumber?.trim() || queryOrderNumber || recentOrderNumber
  const hasExplicitStatus = state.status === 'success' || state.status === 'failed'
  const isFailed = state.status === 'failed'
  const isSuccess = state.status === 'success' || (!hasExplicitStatus && Boolean(orderNumber))
  const paidOnline = state.paymentMethod === 'razorpay'
  const estimatedDelivery = state.estimatedDelivery ?? null

  useEffect(() => {
    if (isSuccess && state.clearCart) {
      clearCart()
    }
  }, [clearCart, isSuccess, state.clearCart])

  if (!isSuccess && !isFailed) {
    return (
      <section className="order-status-page order-status-page--failed">
        <div className="container order-status-page__inner">
          <div className="order-status-card order-status-card--failed">
            <div className="order-status-card__icon order-status-card__icon--failed" aria-hidden="true">
              <span>!</span>
            </div>
            <p className="order-status-card__eyebrow">Order status unavailable</p>
            <h1>We could not restore this checkout session</h1>
            <p className="order-status-card__message">
              Open Orders to check your latest status, or try checkout again.
            </p>
            <div className="order-status-card__actions">
              <Link to="/orders" className="order-status-btn order-status-btn--primary">View orders</Link>
              <Link to="/checkout/review" className="order-status-btn order-status-btn--ghost">Back to checkout</Link>
              <Link to="/" className="order-status-link">Continue shopping</Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (isFailed) {
    return (
      <section className="order-status-page order-status-page--failed">
        <div className="container order-status-page__inner">
          <div className="order-status-card order-status-card--failed">
            <div className="order-status-card__icon order-status-card__icon--failed" aria-hidden="true">
              <span>!</span>
            </div>
            <p className="order-status-card__eyebrow">Something went wrong</p>
            <h1>Order not placed</h1>
            <p className="order-status-card__message">
              {state.message ?? 'We could not complete your order. Please try again.'}
            </p>
            <div className="order-status-card__actions">
              <Link to="/checkout/review" className="order-status-btn order-status-btn--primary">Try again</Link>
              <Link to="/" className="order-status-btn order-status-btn--ghost">Continue shopping</Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="order-status-page order-status-page--success">
      <div className="container order-status-page__inner">
        <div className="order-status-card order-status-card--success">
          <div className="order-status-card__icon order-status-card__icon--success" aria-hidden="true">
            <span>✓</span>
          </div>
          <p className="order-status-card__eyebrow">Order placed successfully</p>
          <h1>Thank you for shopping</h1>
          <p className="order-status-card__message">
            {paidOnline
              ? 'Your payment was received and your order is now awaiting seller acceptance.'
              : 'Your cash on delivery order has been placed and is awaiting seller acceptance.'}
          </p>

          <div className="order-status-card__details">
            <article>
              <span>Order ID</span>
              <strong>{orderNumber || 'Available in Orders'}</strong>
            </article>
            <article>
              <span>Payment</span>
              <strong>{paidOnline ? 'Paid online' : 'Cash on delivery'}</strong>
            </article>
            <article>
              <span>Expected delivery</span>
              <strong>{estimatedDelivery ?? 'Shared after dispatch'}</strong>
            </article>
          </div>

          <div className="order-status-card__actions">
            <Link to="/" className="order-status-btn order-status-btn--primary">Continue shopping</Link>
            <Link
              to={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`}
              className="order-status-btn order-status-btn--ghost"
            >
              Track order
            </Link>
            <Link to="/orders" className="order-status-link">View all orders</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
