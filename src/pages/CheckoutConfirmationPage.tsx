import { Link, useLocation } from 'react-router-dom'

export function CheckoutConfirmationPage() {
  const location = useLocation()
  const state = (location.state as { orderNumber?: string; paymentProvider?: string } | null)
  const orderNumber = state?.orderNumber ?? ''
  const paidOnline = state?.paymentProvider === 'razorpay'

  return (
    <section className="checkout-confirmation-page">
      <div className="container checkout-confirmation-page__inner">
        <div className="checkout-confirmation-card">
          <span className="checkout-confirmation-card__badge">
            {paidOnline ? 'Payment received' : 'Order placed'}
          </span>
          <h1>Thank you for your purchase</h1>
          <p>
            {paidOnline
              ? 'Your Razorpay payment was successful. The order is awaiting seller acceptance.'
              : 'Your order is awaiting seller acceptance.'}
          </p>
          {orderNumber && (
            <div className="checkout-confirmation-meta">
              <article>
                <span>Order number</span>
                <strong>{orderNumber}</strong>
              </article>
            </div>
          )}
          <div className="checkout-confirmation-actions">
            <Link to="/track-order" className="checkout-btn">Track order</Link>
            <Link to="/orders" className="checkout-btn checkout-btn--ghost">View my orders</Link>
            <Link to="/" className="checkout-continue-link">Continue shopping</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
