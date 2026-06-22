import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { checkoutSteps, getCartTotals } from '../lib/checkout'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'

type CheckoutShellProps = {
  children: ReactNode
}

export function CheckoutShell({ children }: CheckoutShellProps) {
  const location = useLocation()
  const { formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const { items, shippingQuote } = useCheckout()
  const { subtotal, shipping, total, itemCount } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })

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
                  <strong>
                    {formatListingPrice(
                      item.price * item.quantity,
                      item.listingCurrencyCode || 'INR',
                    )}
                  </strong>
                </article>
              ))}
            </div>
            <div className="checkout-summary__lines">
              <div><span>Subtotal</span><strong>{formatDisplayAmount(subtotal)}</strong></div>
              <div><span>Shipping</span><strong>{shipping === 0 ? 'Calculated at address' : formatDisplayAmount(shipping)}</strong></div>
              <div className="checkout-summary__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
