import type { ReactNode } from 'react'
import { getCartTotals } from '../lib/checkout'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'

type CheckoutShellProps = {
  children: ReactNode
  showSummary?: boolean
}

export function CheckoutShell({ children, showSummary = true }: CheckoutShellProps) {
  const { formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const { items, shippingQuote } = useCheckout()
  const { subtotal, shipping, total } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })

  return (
    <section className="checkout-page">
      <div className="container checkout-page__inner">
        <div className={showSummary ? 'checkout-layout' : 'checkout-layout checkout-layout--single'}>
          <div className="checkout-main">{children}</div>

          {showSummary && (
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
                <div><span>Shipping</span><strong>{shipping === 0 ? 'Calculated at review' : formatDisplayAmount(shipping)}</strong></div>
                <div className="checkout-summary__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
