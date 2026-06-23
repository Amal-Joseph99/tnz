import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { getCartTotals } from '../lib/checkout'
import { createMarketplaceOrder } from '../lib/marketplaceOrders'
import { startRazorpayCheckout } from '../lib/razorpayPayments'
import { fetchShiprocketServiceability, type ShippingQuote } from '../lib/shiprocketShipping'
import { formatVariantColor, formatVariantSize } from '../lib/variantDisplay'

function variantLabel(item: { variantSize?: string; variantColor?: string }) {
  const parts = [
    item.variantSize ? formatVariantSize(item.variantSize) : '',
    item.variantColor ? formatVariantColor(item.variantColor) : '',
  ].filter(Boolean)

  return parts.join(' · ')
}

export function CheckoutReviewPage() {
  const navigate = useNavigate()
  const { currency, formatDisplayAmount, formatListingPrice, toDisplayListingAmount } = useCurrency()
  const {
    items,
    delivery,
    shippingQuote,
    setShippingQuote,
    setPaymentMethod,
    clearCart,
    addPlacedOrderNumber,
  } = useCheckout()
  const { subtotal, shipping, total } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })
  const [codQuote, setCodQuote] = useState<ShippingQuote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [loadingAction, setLoadingAction] = useState<'razorpay' | 'cod' | null>(null)

  const sellerUserId = items[0]?.sellerUserId
  const isDomesticIndia = delivery?.countryIso2 === 'IN'
  const codAllowed = Boolean(isDomesticIndia && shippingQuote?.codAvailable)
  const codExtraCharge = codQuote?.codCharges ?? shippingQuote?.codCharges ?? 0
  const codTotal = codQuote
    ? getCartTotals(items, codQuote, { toDisplayAmount: toDisplayListingAmount }).total
    : total + toDisplayListingAmount(codExtraCharge, 'INR')

  useEffect(() => {
    if (!delivery || !sellerUserId || items.length === 0) return

    setLoadingQuote(true)
    setQuoteError('')
    setCodQuote(null)

    void fetchShiprocketServiceability({
      sellerUserId,
      deliveryPostcode: delivery.countryIso2 === 'IN' ? delivery.postcode : undefined,
      deliveryCountryIso2: delivery.countryIso2,
      paymentMethod: 'prepaid',
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }).then(async (result) => {
      if (!result.serviceable) {
        setShippingQuote(null)
        setQuoteError(result.message)
        return
      }

      setShippingQuote(result.quote)

      if (delivery.countryIso2 === 'IN' && result.quote.codAvailable) {
        const codResult = await fetchShiprocketServiceability({
          sellerUserId,
          deliveryPostcode: delivery.postcode,
          deliveryCountryIso2: delivery.countryIso2,
          paymentMethod: 'cod',
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        })
        if (codResult.serviceable) {
          setCodQuote(codResult.quote)
        }
      }
    }).catch((error) => {
      setShippingQuote(null)
      setCodQuote(null)
      setQuoteError(error instanceof Error ? error.message : 'Unable to fetch shipping rate.')
    }).finally(() => {
      setLoadingQuote(false)
    })
  }, [delivery, items, sellerUserId, setShippingQuote])

  const lineItems = items.map((item) => ({
    productId: item.productId,
    sellerUserId: item.sellerUserId,
    sku: item.sku,
    title: item.title,
    quantity: item.quantity,
    unitPrice: item.price,
    variantId: item.variantId,
  }))

  const goToFailed = (message: string) => {
    navigate('/checkout/status', {
      state: {
        status: 'failed',
        message,
        estimatedDelivery: shippingQuote?.estimatedDelivery ?? null,
      },
    })
  }

  const goToSuccess = (orderNumber: string, paymentMethod: 'razorpay' | 'cod') => {
    addPlacedOrderNumber(orderNumber)
    clearCart()
    navigate('/checkout/status', {
      state: {
        status: 'success',
        orderNumber,
        paymentMethod,
        estimatedDelivery: shippingQuote?.estimatedDelivery ?? null,
      },
    })
  }

  const payWithRazorpay = async () => {
    if (!delivery || !shippingQuote || items.length === 0) return

    setLoadingAction('razorpay')
    setPaymentMethod('razorpay')

    try {
      const razorpayResult = await startRazorpayCheckout({
        sellerUserId: items[0].sellerUserId,
        currencyCode: currency,
        subtotal,
        shippingAmount: shippingQuote.shippingCharge,
        codChargesAmount: 0,
        totalAmount: total,
        delivery,
        shippingQuote,
        items: lineItems,
      })

      goToSuccess(razorpayResult.orderNumber, 'razorpay')
    } catch (checkoutError) {
      goToFailed(checkoutError instanceof Error ? checkoutError.message : 'Payment could not be completed.')
    } finally {
      setLoadingAction(null)
    }
  }

  const placeCodOrder = async () => {
    if (!delivery || !shippingQuote || items.length === 0 || !codAllowed) return

    setLoadingAction('cod')
    setPaymentMethod('cod')

    try {
      let activeCodQuote = codQuote
      if (!activeCodQuote) {
        const codResult = await fetchShiprocketServiceability({
          sellerUserId: items[0].sellerUserId,
          deliveryPostcode: delivery.postcode,
          deliveryCountryIso2: delivery.countryIso2,
          paymentMethod: 'cod',
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        })

        if (!codResult.serviceable) {
          goToFailed(codResult.message)
          return
        }

        activeCodQuote = codResult.quote
        setCodQuote(activeCodQuote)
      }

      const codTotals = getCartTotals(items, activeCodQuote, {
        toDisplayAmount: toDisplayListingAmount,
      })

      const result = await createMarketplaceOrder({
        sellerUserId: items[0].sellerUserId,
        paymentMethod: 'cod',
        currencyCode: currency,
        subtotal: codTotals.subtotal,
        shippingAmount: activeCodQuote.shippingCharge,
        codChargesAmount: activeCodQuote.codCharges,
        totalAmount: codTotals.total,
        delivery,
        shippingQuote: activeCodQuote,
        items: lineItems,
      })

      if (!result.ok) {
        goToFailed(result.message)
        return
      }

      goToSuccess(result.orderNumber, 'cod')
    } catch (checkoutError) {
      goToFailed(checkoutError instanceof Error ? checkoutError.message : 'Order could not be placed.')
    } finally {
      setLoadingAction(null)
    }
  }

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
          <h2>Order total</h2>
        </div>

        {loadingQuote && <p>Calculating your order total...</p>}
        {quoteError && <div className="auth-message auth-message--error">{quoteError}</div>}

        {shippingQuote && (
          <>
            <div className="checkout-review-totals">
              <div><span>Subtotal</span><strong>{formatDisplayAmount(subtotal)}</strong></div>
              <div><span>Shipping</span><strong>{shipping > 0 ? formatDisplayAmount(shipping) : '—'}</strong></div>
              <div className="checkout-review-totals__total"><span>Total</span><strong>{formatDisplayAmount(total)}</strong></div>
            </div>

            <div className="checkout-review-meta">
              <div>
                <span>Estimated delivery</span>
                <strong>{shippingQuote.estimatedDelivery ?? '—'}</strong>
              </div>
              {isDomesticIndia && (
                <div>
                  <span>COD availability</span>
                  <strong>
                    {codAllowed
                      ? `Available +${formatDisplayAmount(toDisplayListingAmount(codExtraCharge, 'INR'))}`
                      : 'Not available for this address'}
                  </strong>
                </div>
              )}
            </div>

            <div className="checkout-review-payment">
              <h3>Select payment method</h3>
              <div className="checkout-review-payment__actions">
                <button
                  type="button"
                  className="checkout-btn checkout-btn--place"
                  disabled={loadingAction !== null}
                  onClick={() => void payWithRazorpay()}
                >
                  {loadingAction === 'razorpay' ? 'Opening Razorpay...' : `Pay now & place order · ${formatDisplayAmount(total)}`}
                </button>
                {isDomesticIndia && (
                  <button
                    type="button"
                    className="checkout-btn checkout-btn--cod"
                    disabled={!codAllowed || loadingAction !== null}
                    onClick={() => void placeCodOrder()}
                  >
                    {loadingAction === 'cod'
                      ? 'Placing order...'
                      : `Cash on delivery · ${formatDisplayAmount(codTotal)}`}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <div className="checkout-actions">
        <Link to="/checkout" className="checkout-btn checkout-btn--ghost">Back</Link>
      </div>
    </CheckoutShell>
  )
}
