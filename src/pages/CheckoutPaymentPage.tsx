import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'

export function CheckoutPaymentPage() {
  const [method, setMethod] = useState('card')

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Payment method</h2>
          <p>All transactions are encrypted and processed securely.</p>
        </div>

        <div className="checkout-options">
          <label className={method === 'card' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input type="radio" name="payment" value="card" checked={method === 'card'} onChange={() => setMethod('card')} />
            <div>
              <strong>Credit / debit card</strong>
              <span>Visa, Mastercard, RuPay</span>
            </div>
          </label>
          <label className={method === 'upi' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input type="radio" name="payment" value="upi" checked={method === 'upi'} onChange={() => setMethod('upi')} />
            <div>
              <strong>UPI</strong>
              <span>Google Pay, PhonePe, Paytm</span>
            </div>
          </label>
          <label className={method === 'cod' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input type="radio" name="payment" value="cod" checked={method === 'cod'} onChange={() => setMethod('cod')} />
            <div>
              <strong>Cash on delivery</strong>
              <span>Pay when your order arrives</span>
            </div>
          </label>
        </div>
      </section>

      {method === 'card' && (
        <section className="checkout-panel">
          <div className="checkout-panel__header">
            <h2>Card details</h2>
            <p>Enter the card used for this purchase.</p>
          </div>
          <form className="checkout-form checkout-form--grid" onSubmit={(event) => event.preventDefault()}>
            <label className="checkout-form__full">
              Name on card
              <input type="text" placeholder="As printed on card" required />
            </label>
            <label className="checkout-form__full">
              Card number
              <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" required />
            </label>
            <label>
              Expiry date
              <input type="text" placeholder="MM / YY" required />
            </label>
            <label>
              CVV
              <input type="password" inputMode="numeric" placeholder="***" required />
            </label>
          </form>
        </section>
      )}

      {method === 'upi' && (
        <section className="checkout-panel">
          <div className="checkout-panel__header">
            <h2>UPI ID</h2>
            <p>We will send a payment request to your UPI app.</p>
          </div>
          <form className="checkout-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              UPI ID
              <input type="text" placeholder="name@upi" required />
            </label>
          </form>
        </section>
      )}

      {method === 'cod' && (
        <section className="checkout-panel checkout-panel--note">
          <p>Cash on delivery is available for this order. Please keep exact change ready for the delivery partner.</p>
        </section>
      )}

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Billing address</h2>
          <p>Used for invoice and payment verification.</p>
        </div>
        <label className="checkout-checkbox">
          <input type="checkbox" defaultChecked />
          Same as delivery address
        </label>
      </section>

      <div className="checkout-actions">
        <Link to="/checkout" className="checkout-btn checkout-btn--ghost">Back to address</Link>
        <Link to="/checkout/review" className="checkout-btn">Review order</Link>
      </div>
    </CheckoutShell>
  )
}
