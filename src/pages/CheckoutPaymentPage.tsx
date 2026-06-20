import { Link } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'

export function CheckoutPaymentPage() {
  const { paymentMethod, setPaymentMethod, delivery } = useCheckout()
  const isInternational = delivery?.countryIso2 && delivery.countryIso2 !== 'IN'

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Payment method</h2>
        </div>

        <div className="checkout-options">
          <label className={paymentMethod === 'stripe' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} />
            <div>
              <strong>Pay with Stripe</strong>
              <span>Global cards, Apple Pay, Google Pay · charged in your display currency</span>
            </div>
          </label>
          {!isInternational && (
            <label className={paymentMethod === 'cod' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              <div>
                <strong>Cash on delivery</strong>
                <span>India domestic only · COD charges added to shipping</span>
              </div>
            </label>
          )}
        </div>
      </section>

      <div className="checkout-actions">
        <Link to="/checkout" className="checkout-btn checkout-btn--ghost">Back</Link>
        <Link to="/checkout/review" className="checkout-btn">Review order</Link>
      </div>
    </CheckoutShell>
  )
}
