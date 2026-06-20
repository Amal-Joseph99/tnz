import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { getCartTotals } from '../lib/checkout'
import { createMarketplaceOrder } from '../lib/marketplaceOrders'
import { startStripeCheckout } from '../lib/stripePayments'

export function CheckoutReviewPage() {
  const navigate = useNavigate()
  const { currency } = useCurrency()
  const {
    items,
    delivery,
    paymentMethod,
    shippingQuote,
    clearCart,
    addPlacedOrderNumber,
  } = useCheckout()
  const { formatPrice } = useCurrency()
  const { subtotal, tax, total } = getCartTotals(items, shippingQuote)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const placeOrder = async () => {
    if (!delivery || !shippingQuote || items.length === 0) return

    setLoading(true)
    setError('')

    try {
      if (paymentMethod === 'cod') {
        const result = await createMarketplaceOrder({
          sellerUserId: items[0].sellerUserId,
          paymentMethod: 'cod',
          currencyCode: currency,
          subtotal,
          shippingAmount: shippingQuote.shippingCharge,
          codChargesAmount: shippingQuote.codCharges,
          taxAmount: tax,
          totalAmount: total,
          delivery,
          shippingQuote,
          items: items.map((item) => ({
            productId: item.productId,
            sellerUserId: item.sellerUserId,
            sku: item.sku,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.price,
            variantId: item.variantId,
          })),
        })

        if (!result.ok) {
          setError(result.message)
          return
        }

        addPlacedOrderNumber(result.orderNumber)
        clearCart()
        navigate('/checkout/confirmation', { state: { orderNumber: result.orderNumber } })
        return
      }

      const stripeResult = await startStripeCheckout({
        sellerUserId: items[0].sellerUserId,
        currencyCode: currency,
        subtotal,
        shippingAmount: shippingQuote.shippingCharge,
        codChargesAmount: 0,
        taxAmount: tax,
        totalAmount: total,
        delivery,
        shippingQuote,
        items: items.map((item) => ({
          productId: item.productId,
          sellerUserId: item.sellerUserId,
          sku: item.sku,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.price,
          variantId: item.variantId,
        })),
      })

      clearCart()
      window.location.assign(stripeResult.checkoutUrl)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start payment.')
    } finally {
      setLoading(false)
    }
  }

  const actionLabel = paymentMethod === 'cod'
    ? (loading ? 'Placing order...' : `Place order · ${formatPrice(total)}`)
    : (loading ? 'Redirecting to Stripe...' : `Pay with Stripe · ${formatPrice(total)}`)

  return (
    <CheckoutShell>
      {error && <div className="auth-message auth-message--error">{error}</div>}

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Review order</h2>
        </div>

        <div className="checkout-review-grid">
          <article className="checkout-review-card">
            <div className="checkout-review-card__header">
              <h3>Delivery</h3>
              <Link to="/checkout">Edit</Link>
            </div>
            {delivery ? (
              <>
                <p>{delivery.fullName}</p>
                <p>{delivery.addressLine1}</p>
                <p>{delivery.city}, {delivery.state} {delivery.postcode}</p>
                <p>{delivery.countryIso2}</p>
              </>
            ) : (
              <p>No delivery address</p>
            )}
          </article>

          <article className="checkout-review-card">
            <div className="checkout-review-card__header">
              <h3>Shipping</h3>
            </div>
            {shippingQuote ? (
              <>
                <p>{shippingQuote.courierName ?? 'Lowest Shiprocket rate'}</p>
                <p>ETA: {shippingQuote.estimatedDelivery ?? '—'}</p>
                <p>{formatPrice(shippingQuote.totalShippingCharge)}</p>
              </>
            ) : (
              <p>Shipping quote missing</p>
            )}
          </article>
        </div>
      </section>

      <section className="checkout-panel">
        <div className="checkout-review-items">
          {items.map((item) => (
            <article key={item.productId} className="checkout-review-item">
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
      </section>

      <div className="checkout-actions checkout-actions--final">
        <Link to="/checkout/payment" className="checkout-btn checkout-btn--ghost">Back</Link>
        <button
          type="button"
          className="checkout-btn checkout-btn--place"
          disabled={loading || items.length === 0 || !delivery || !shippingQuote}
          onClick={() => void placeOrder()}
        >
          {actionLabel}
        </button>
      </div>
    </CheckoutShell>
  )
}
