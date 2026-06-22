import { Link, Navigate, useLocation } from 'react-router-dom'

export function CheckoutOrderStatusPage() {
  const location = useLocation()
  const state = (location.state as { orderNumber?: string; paymentMethod?: 'razorpay' | 'cod' } | null)
  const orderNumber = state?.orderNumber ?? ''
  const paidOnline = state?.paymentMethod === 'razorpay'

  if (!orderNumber) {
    return <Navigate to="/orders" replace />
  }

  return (
    <section className="checkout-confirmation-page">
      <div className="container checkout-confirmation-page__inner">
        <div className="checkout-confirmation-card">
          <span className="checkout-confirmation-card__badge">
            {paidOnline ? 'Payment received' : 'Order placed'}
          </span>
          <h1>Order status</h1>
          <p>
            {paidOnline
              ? 'Your Razorpay payment was successful. The order is awaiting seller acceptance.'
              : 'Your cash on delivery order is awaiting seller acceptance.'}
          </p>
          <div className="checkout-confirmation-meta">
            <article>
              <span>Order number</span>
              <strong>{orderNumber}</strong>
            </article>
            <article>
              <span>Status</span>
              <strong>{paidOnline ? 'Awaiting seller acceptance' : 'Pending seller acceptance'}</strong>
            </article>
          </div>
          <div className="checkout-confirmation-actions">
            <Link to={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`} className="checkout-btn">Track order</Link>
            <Link to="/orders" className="checkout-btn checkout-btn--ghost">View my orders</Link>
            <Link to="/" className="checkout-continue-link">Continue shopping</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
