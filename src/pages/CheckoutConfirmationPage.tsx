import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { fetchStripeCheckoutStatus } from '../lib/stripePayments'

export function CheckoutConfirmationPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const stateOrderNumber = (location.state as { orderNumber?: string; paymentProvider?: string } | null)?.orderNumber
  const paymentProvider = (location.state as { paymentProvider?: string } | null)?.paymentProvider
  const [orderNumber, setOrderNumber] = useState(stateOrderNumber ?? '')
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return

    void fetchStripeCheckoutStatus(sessionId)
      .then((result) => {
        if (!result.paid) {
          setError('Payment is still processing. Refresh this page in a moment or check your orders.')
        }
        setOrderNumber(result.orderNumber)
      })
      .catch((statusError) => {
        setError(statusError instanceof Error ? statusError.message : 'Unable to verify Stripe payment.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sessionId])

  return (
    <section className="checkout-confirmation-page">
      <div className="container checkout-confirmation-page__inner">
        <div className="checkout-confirmation-card">
          <span className="checkout-confirmation-card__badge">
            {sessionId || paymentProvider === 'razorpay' ? 'Payment received' : 'Order placed'}
          </span>
          <h1>Thank you for your purchase</h1>
          <p>
            {sessionId
              ? 'Your Stripe payment was successful. The order is awaiting seller acceptance.'
              : paymentProvider === 'razorpay'
                ? 'Your Razorpay payment was successful. The order is awaiting seller acceptance.'
                : 'Your India-origin order is awaiting seller acceptance.'}
          </p>
          {loading && <p>Confirming payment...</p>}
          {error && <div className="auth-message auth-message--error">{error}</div>}
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
