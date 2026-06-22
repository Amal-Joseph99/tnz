import { Link } from 'react-router-dom'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { getCartTotals } from '../lib/checkout'
import { formatVariantColor, formatVariantSize } from '../lib/variantDisplay'

function variantLabel(item: { variantSize?: string; variantColor?: string }) {
  const parts = [
    item.variantSize ? formatVariantSize(item.variantSize) : '',
    item.variantColor ? formatVariantColor(item.variantColor) : '',
  ].filter(Boolean)

  return parts.join(' · ')
}

export function CartPage() {
  const { formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const { items, shippingQuote, updateQuantity } = useCheckout()
  const { subtotal, shipping, tax, total } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })

  return (
    <section className="cart-page">
      <div className="container cart-page__inner">
        <header className="cart-page__header">
          <span>Shopping cart</span>
          <h1>Your cart</h1>
          <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart.</p>
        </header>

        {items.length === 0 ? (
          <PanelEmptyState title="Your cart is empty" message="Browse the marketplace and add products to checkout." />
        ) : (
          <div className="cart-layout">
            <section className="cart-items-panel">
              <div className="cart-items-toolbar">
                <h2>Items</h2>
              </div>
              <div className="cart-item-list">
                {items.map((item) => (
                  <article key={item.id} className="cart-item-row">
                    <img src={item.image} alt={item.title} />
                    <div className="cart-item-row__details">
                      <span>{item.brand}</span>
                      <h3>
                        <Link to={`/product/${item.productId}`}>{item.title}</Link>
                      </h3>
                      {variantLabel(item) && <span>{variantLabel(item)}</span>}
                      <div className="cart-item-row__controls">
                        <label>
                          Qty
                          <select
                            value={item.quantity}
                            aria-label={`Quantity for ${item.title}`}
                            onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                          >
                            {[1, 2, 3, 4, 5].map((qty) => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="cart-item-row__price">
                      <strong>
                        {formatListingPrice(
                          item.price * item.quantity,
                          item.listingCurrencyCode,
                        )}
                      </strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="cart-summary-panel">
              <h2>Order summary</h2>
              <div className="cart-summary-lines">
                <div><span>Subtotal</span><strong>{formatDisplayAmount(subtotal)}</strong></div>
                <div><span>Shipping</span><strong>{shipping > 0 ? formatDisplayAmount(shipping) : 'At checkout'}</strong></div>
                <div><span>Tax</span><strong>{formatDisplayAmount(tax)}</strong></div>
                <div className="cart-summary-lines__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
              </div>
              <Link to="/checkout" className="cart-checkout-btn">Proceed to checkout</Link>
              <Link to="/" className="cart-continue-link">Continue shopping</Link>
            </aside>
          </div>
        )}

        {items.length === 0 && (
          <Link to="/" className="cart-continue-link">Continue shopping</Link>
        )}
      </div>
    </section>
  )
}
