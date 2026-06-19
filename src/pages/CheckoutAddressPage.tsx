import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'

export function CheckoutAddressPage() {
  const [delivery, setDelivery] = useState('standard')

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Delivery address</h2>
          <p>Where should we deliver your order?</p>
        </div>

        <form className="checkout-form checkout-form--grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input type="text" defaultValue="Akhil P" required />
          </label>
          <label>
            Phone number
            <input type="tel" defaultValue="+91 98765 43210" required />
          </label>
          <label className="checkout-form__full">
            Address line 1
            <input type="text" defaultValue="12 Market Road" required />
          </label>
          <label className="checkout-form__full">
            Address line 2
            <input type="text" placeholder="Apartment, suite, landmark (optional)" />
          </label>
          <label>
            City
            <input type="text" defaultValue="Taliparamba" required />
          </label>
          <label>
            State
            <input type="text" defaultValue="Kerala" required />
          </label>
          <label>
            PIN code
            <input type="text" defaultValue="670141" required />
          </label>
          <label>
            Country
            <select defaultValue="IN">
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </label>
        </form>
      </section>

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Delivery method</h2>
          <p>Choose how fast you want your order.</p>
        </div>

        <div className="checkout-options">
          <label className={delivery === 'standard' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input
              type="radio"
              name="delivery"
              value="standard"
              checked={delivery === 'standard'}
              onChange={() => setDelivery('standard')}
            />
            <div>
              <strong>Standard delivery</strong>
              <span>3–5 business days · Free on orders over $50</span>
            </div>
          </label>
          <label className={delivery === 'express' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input
              type="radio"
              name="delivery"
              value="express"
              checked={delivery === 'express'}
              onChange={() => setDelivery('express')}
            />
            <div>
              <strong>Express delivery</strong>
              <span>1–2 business days · Additional charge at payment</span>
            </div>
          </label>
        </div>
      </section>

      <div className="checkout-actions">
        <Link to="/cart" className="checkout-btn checkout-btn--ghost">Back to cart</Link>
        <Link to="/checkout/payment" className="checkout-btn">Continue to payment</Link>
      </div>
    </CheckoutShell>
  )
}
