import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
import { defaultCartItems, getCartTotals } from '../lib/checkout'

export function CheckoutConfirmationPage() {
  const { formatPrice } = useCurrency()
  const { total, itemCount } = getCartTotals(defaultCartItems)

  return (
    <section className="checkout-confirmation-page">
      <div className="container checkout-confirmation-page__inner">
        <div className="checkout-confirmation-card">
          <span className="checkout-confirmation-card__badge">Order placed</span>
          <h1>Thank you for your purchase</h1>
          <p>
            Your order has been confirmed. A receipt will be sent to your registered email address.
          </p>

          <div className="checkout-confirmation-meta">
            <article>
              <span>Order total</span>
              <strong>{formatPrice(total)}</strong>
            </article>
            <article>
              <span>Items</span>
              <strong>{itemCount}</strong>
            </article>
          </div>

          {defaultCartItems.length > 0 && (
            <div className="checkout-confirmation-items">
              {defaultCartItems.map((item) => (
                <article key={item.id} className="checkout-confirmation-item">
                  <img src={item.image} alt={item.title} />
                  <div>
                    <strong>{item.brand}</strong>
                    <p>{item.title}</p>
                    <span>Qty {item.quantity}</span>
                  </div>
                </article>
              ))}
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
