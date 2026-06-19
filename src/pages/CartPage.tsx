import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { defaultCartItems, getCartTotals } from '../lib/checkout'

export function CartPage() {
  const { formatPrice } = useCurrency()
  const { subtotal, shipping, total } = getCartTotals(defaultCartItems)

  return (
    <section className="cart-page">
      <div className="container cart-page__inner">
        <header className="cart-page__header">
          <span>Shopping cart</span>
          <h1>Your cart</h1>
          <p>{defaultCartItems.length} item{defaultCartItems.length !== 1 ? 's' : ''} in your cart.</p>
        </header>

        {defaultCartItems.length === 0 ? (
          <PanelEmptyState
            title="Your cart is empty"
            message="Browse the marketplace and add products to checkout."
          />
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-items-toolbar">
                <h2>Items</h2>
              </div>
              <div className="cart-item-list">
                {defaultCartItems.map((item) => (
                  <article key={item.id} className="cart-item-row">
                    <img src={item.image} alt={item.title} />
                    <div className="cart-item-row__details">
                      <span>{item.brand}</span>
                      <h3>
                        <Link to={`/product/${item.id}`}>{item.title}</Link>
                      </h3>
                      <div className="cart-item-row__controls">
                        <label>
                          Qty
                          <select defaultValue={item.quantity} aria-label={`Quantity for ${item.title}`}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="cart-item-row__price">
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                      {item.originalPrice && (
                        <span>{formatPrice(item.originalPrice * item.quantity)}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="cart-summary-panel">
              <h2>Order summary</h2>
              <div className="cart-summary-lines">
                <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <div><span>Shipping</span><strong>{shipping === 0 ? 'Free' : formatPrice(shipping)}</strong></div>
                <div className="cart-summary-lines__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
              </div>
              <Link to="/checkout" className="cart-checkout-btn">Proceed to checkout</Link>
              <Link to="/" className="cart-continue-link">Continue shopping</Link>
            </aside>
          </div>
        )}

        {defaultCartItems.length === 0 && (
          <Link to="/" className="cart-continue-link">Continue shopping</Link>
        )}
      </div>
    </section>
  )
}
