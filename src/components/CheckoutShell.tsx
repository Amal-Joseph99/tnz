import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { checkoutSteps, defaultCartItems, getCartTotals, type CartItem } from '../lib/checkout'
import { useCurrency } from '../context/CurrencyContext'

type CheckoutShellProps = {
  children: ReactNode
  items?: CartItem[]
}

export function CheckoutShell({ children, items = defaultCartItems }: CheckoutShellProps) {
  const location = useLocation()
  const { formatPrice } = useCurrency()
  const { subtotal, shipping, tax, total, itemCount } = getCartTotals(items)

  const activeIndex = checkoutSteps.findIndex((step) => step.path === location.pathname)

  return (
    <section className="checkout-page">
      <div className="container checkout-page__inner">
        <header className="checkout-page__header">
          <div>
            <span>Secure checkout</span>
            <h1>Checkout</h1>
            <p>{itemCount} item{itemCount !== 1 ? 's' : ''} in your order.</p>
          </div>
          <Link to="/cart" className="checkout-page__back">Back to cart</Link>
        </header>

        <nav className="checkout-steps" aria-label="Checkout progress">
          {checkoutSteps.slice(0, 3).map((step, index) => {
            const isComplete = activeIndex > index
            const isActive = activeIndex === index
            return (
              <div
                key={step.id}
                className={
                  isComplete
                    ? 'checkout-steps__item checkout-steps__item--complete'
                    : isActive
                      ? 'checkout-steps__item checkout-steps__item--active'
                      : 'checkout-steps__item'
                }
              >
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </div>
            )
          })}
        </nav>

        <div className="checkout-layout">
          <div className="checkout-main">{children}</div>

          <aside className="checkout-summary">
            <h2>Order summary</h2>
            <div className="checkout-summary__items">
              {items.map((item) => (
                <article key={item.id} className="checkout-summary__item">
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
            <div className="checkout-summary__lines">
              <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <div><span>Shipping</span><strong>{shipping === 0 ? 'Free' : formatPrice(shipping)}</strong></div>
              <div><span>Estimated tax</span><strong>{formatPrice(tax)}</strong></div>
              <div className="checkout-summary__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
