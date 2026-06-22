import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { getCartTotals } from '../lib/checkout'
import { fetchShiprocketServiceability } from '../lib/shiprocketShipping'
import { formatVariantColor, formatVariantSize } from '../lib/variantDisplay'

function variantLabel(item: { variantSize?: string; variantColor?: string }) {
  const parts = [
    item.variantSize ? formatVariantSize(item.variantSize) : '',
    item.variantColor ? formatVariantColor(item.variantColor) : '',
  ].filter(Boolean)

  return parts.join(' · ')
}

export function CheckoutReviewPage() {
  const { formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const { items, delivery, shippingQuote, setShippingQuote } = useCheckout()
  const { subtotal, shipping, total } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  const sellerUserId = items[0]?.sellerUserId
  const isDomesticIndia = delivery?.countryIso2 === 'IN'

  useEffect(() => {
    if (!delivery || !sellerUserId || items.length === 0) return

    setLoadingQuote(true)
    setQuoteError('')

    void fetchShiprocketServiceability({
      sellerUserId,
      deliveryPostcode: delivery.countryIso2 === 'IN' ? delivery.postcode : undefined,
      deliveryCountryIso2: delivery.countryIso2,
      paymentMethod: 'prepaid',
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }).then((result) => {
      if (!result.serviceable) {
        setShippingQuote(null)
        setQuoteError(result.message)
        return
      }

      setShippingQuote(result.quote)
    }).catch((error) => {
      setShippingQuote(null)
      setQuoteError(error instanceof Error ? error.message : 'Unable to fetch shipping rate.')
    }).finally(() => {
      setLoadingQuote(false)
    })
  }, [delivery, items, sellerUserId, setShippingQuote])

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  if (!delivery) {
    return <Navigate to="/checkout" replace />
  }

  return (
    <CheckoutShell showSummary={false}>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Order review</h2>
        </div>

        <div className="checkout-review-items">
          {items.map((item) => (
            <article key={item.id} className="checkout-review-item">
              <img src={item.image} alt={item.title} />
              <div>
                <strong>{item.brand}</strong>
                <p>{item.title}</p>
                {variantLabel(item) && <span>{variantLabel(item)}</span>}
                <span>Qty {item.quantity}</span>
              </div>
              <strong>{formatListingPrice(item.price * item.quantity, item.listingCurrencyCode)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="checkout-review-address-card">
        <div className="checkout-review-address-card__header">
          <h3>Delivery address</h3>
          <Link to="/checkout">Edit</Link>
        </div>
        <p>{delivery.fullName}</p>
        <p>{delivery.phone}</p>
        <p>{delivery.email}</p>
        <p>{delivery.addressLine1}</p>
        {delivery.addressLine2 && <p>{delivery.addressLine2}</p>}
        <p>{delivery.city}, {delivery.state} {delivery.postcode}</p>
        <p>{delivery.countryIso2}</p>
      </section>

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Shipping</h2>
        </div>

        {loadingQuote && <p>Fetching live shipping rate...</p>}
        {quoteError && <div className="auth-message auth-message--error">{quoteError}</div>}

        {shippingQuote && (
          <div className="checkout-shipping-quote">
            <div><span>Courier</span><strong>{shippingQuote.courierName ?? 'Lowest rate'}</strong></div>
            <div><span>Shipping charge</span><strong>{formatDisplayAmount(toDisplayListingAmount(shippingQuote.shippingCharge, 'INR'))}</strong></div>
            <div><span>Estimated delivery</span><strong>{shippingQuote.estimatedDelivery ?? '—'}</strong></div>
            {isDomesticIndia && (
              <div>
                <span>COD availability</span>
                <strong>{shippingQuote.codAvailable ? 'Available for this address' : 'Not available for this address'}</strong>
              </div>
            )}
          </div>
        )}

        <div className="checkout-review-totals">
          <div><span>Subtotal</span><strong>{formatDisplayAmount(subtotal)}</strong></div>
          <div><span>Shipping</span><strong>{shipping > 0 ? formatDisplayAmount(shipping) : '—'}</strong></div>
          <div className="checkout-review-totals__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
        </div>
      </section>

      <div className="checkout-actions">
        <Link to="/checkout" className="checkout-btn checkout-btn--ghost">Back</Link>
        {shippingQuote ? (
          <Link to="/checkout/payment" className="checkout-btn">
            Continue to payment
          </Link>
        ) : (
          <span className="checkout-btn checkout-btn--disabled" aria-disabled="true">
            Continue to payment
          </span>
        )}
      </div>
    </CheckoutShell>
  )
}
