import { Link, Navigate, useLocation } from 'react-router-dom'

type OrderStatusState = {
  status?: 'success' | 'failed'
  orderNumber?: string
  paymentMethod?: 'razorpay' | 'cod'
  estimatedDelivery?: string | null
  message?: string
}

export function CheckoutOrderStatusPage() {
  const location = useLocation()
  const state = (location.state as OrderStatusState | null) ?? {}
  const isSuccess = state.status !== 'failed'
  const orderNumber = state.orderNumber ?? ''
  const paidOnline = state.paymentMethod === 'razorpay'
  const estimatedDelivery = state.estimatedDelivery ?? null

  if (!state.status && !orderNumber) {
    return <Navigate to="/orders" replace />
  }

  if (!isSuccess) {
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

  if (!orderNumber) {
    return <Navigate to="/orders" replace />
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
              <strong>{orderNumber}</strong>
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
