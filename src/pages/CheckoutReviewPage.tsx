import { Link, useNavigate } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { useCurrency } from '../context/CurrencyContext'
import { defaultCartItems, getCartTotals } from '../lib/checkout'

export function CheckoutReviewPage() {
  const navigate = useNavigate()
  const { formatPrice } = useCurrency()
  const { total } = getCartTotals(defaultCartItems)

  const placeOrder = () => {
    navigate('/checkout/confirmation')
  }

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Review your order</h2>
          <p>Confirm delivery, payment, and items before placing the order.</p>
        </div>

        <div className="checkout-review-grid">
          <article className="checkout-review-card">
            <div className="checkout-review-card__header">
              <h3>Delivery</h3>
              <Link to="/checkout">Edit</Link>
            </div>
            <p>No delivery address added yet.</p>
          </article>

          <article className="checkout-review-card">
            <div className="checkout-review-card__header">
              <h3>Payment</h3>
              <Link to="/checkout/payment">Edit</Link>
            </div>
            <p>No payment method selected yet.</p>
          </article>
        </div>
      </section>

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Items in this order</h2>
          <p>{defaultCartItems.length} products from verified sellers.</p>
        </div>
        {defaultCartItems.length > 0 ? (
          <div className="checkout-review-items">
            {defaultCartItems.map((item) => (
              <article key={item.id} className="checkout-review-item">
                <img src={item.image} alt={item.title} />
                <div>
                  <strong>{item.brand}</strong>
                  <p>{item.title}</p>
                  <span>Qty {item.quantity}</span>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <PanelEmptyState
            title="No items in cart"
            message="Add products to your cart before placing an order."
          />
        )}
      </section>

      <section className="checkout-panel checkout-panel--terms">
        <label className="checkout-checkbox">
          <input type="checkbox" />
          I agree to the marketplace terms, seller policies, and return conditions for this order.
        </label>
      </section>

      <div className="checkout-actions checkout-actions--final">
        <Link to="/checkout/payment" className="checkout-btn checkout-btn--ghost">Back to payment</Link>
        <button type="button" className="checkout-btn checkout-btn--place" onClick={placeOrder} disabled={defaultCartItems.length === 0}>
          Place order · {formatPrice(total)}
        </button>
      </div>
    </CheckoutShell>
  )
}
