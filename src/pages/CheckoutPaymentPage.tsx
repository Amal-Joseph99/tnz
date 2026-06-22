import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { getCartTotals } from '../lib/checkout'
import { createMarketplaceOrder } from '../lib/marketplaceOrders'
import { startRazorpayCheckout } from '../lib/razorpayPayments'
import { fetchShiprocketServiceability } from '../lib/shiprocketShipping'

export function CheckoutPaymentPage() {
  const navigate = useNavigate()
  const { currency, formatDisplayAmount, toDisplayListingAmount } = useCurrency()
  const {
    items,
    delivery,
    paymentMethod,
    setPaymentMethod,
    shippingQuote,
    setShippingQuote,
    clearCart,
    addPlacedOrderNumber,
  } = useCheckout()
  const { subtotal, total } = getCartTotals(items, shippingQuote, {
    toDisplayAmount: toDisplayListingAmount,
  })
  const [loading, setLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [error, setError] = useState('')

  const sellerUserId = items[0]?.sellerUserId
  const isInternational = delivery?.countryIso2 && delivery.countryIso2 !== 'IN'
  const isDomesticIndia = delivery?.countryIso2 === 'IN'
  const codAllowed = Boolean(isDomesticIndia && shippingQuote?.codAvailable)

  useEffect(() => {
    if (!delivery || !sellerUserId || items.length === 0) return
    if (paymentMethod === 'cod' && !codAllowed) return

    setQuoteError('')

    void fetchShiprocketServiceability({
      sellerUserId,
      deliveryPostcode: delivery.countryIso2 === 'IN' ? delivery.postcode : undefined,
      deliveryCountryIso2: delivery.countryIso2,
      paymentMethod: paymentMethod === 'cod' ? 'cod' : 'prepaid',
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    }).then((result) => {
      if (!result.serviceable) {
        setShippingQuote(null)
        setQuoteError(result.message)
        return
      }

      setShippingQuote(result.quote)
    }).catch((quoteFetchError) => {
      setShippingQuote(null)
      setQuoteError(quoteFetchError instanceof Error ? quoteFetchError.message : 'Unable to refresh shipping rate.')
    })
  }, [codAllowed, delivery, items, paymentMethod, sellerUserId, setShippingQuote])

  useEffect(() => {
    if (paymentMethod === 'cod' && !codAllowed) {
      setPaymentMethod('razorpay')
    }
  }, [codAllowed, paymentMethod, setPaymentMethod])

  const placeOrder = async () => {
    if (!delivery || !shippingQuote || items.length === 0) return

    setLoading(true)
    setError('')

    const lineItems = items.map((item) => ({
      productId: item.productId,
      sellerUserId: item.sellerUserId,
      sku: item.sku,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.price,
      variantId: item.variantId,
    }))

    try {
      if (paymentMethod === 'cod') {
        const result = await createMarketplaceOrder({
          sellerUserId: items[0].sellerUserId,
          paymentMethod: 'cod',
          currencyCode: currency,
          subtotal,
          shippingAmount: shippingQuote.shippingCharge,
          codChargesAmount: shippingQuote.codCharges,
          totalAmount: total,
          delivery,
          shippingQuote,
          items: lineItems,
        })

        if (!result.ok) {
          setError(result.message)
          return
        }

        addPlacedOrderNumber(result.orderNumber)
        clearCart()
        navigate('/checkout/status', { state: { orderNumber: result.orderNumber, paymentMethod: 'cod' } })
        return
      }

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

      addPlacedOrderNumber(razorpayResult.orderNumber)
      clearCart()
      navigate('/checkout/status', {
        state: {
          orderNumber: razorpayResult.orderNumber,
          paymentMethod: 'razorpay',
        },
      })
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to complete payment.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  if (!delivery || !shippingQuote) {
    return <Navigate to="/checkout/review" replace />
  }

  const actionLabel = paymentMethod === 'cod'
    ? (loading ? 'Placing order...' : `Place order · ${formatDisplayAmount(total)}`)
    : (loading ? 'Opening Razorpay...' : `Pay with Razorpay · ${formatDisplayAmount(total)}`)

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Payment method</h2>
        </div>

        {quoteError && <div className="auth-message auth-message--error">{quoteError}</div>}
        {error && <div className="auth-message auth-message--error">{error}</div>}

        <div className="checkout-options">
          <label className={paymentMethod === 'razorpay' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
            <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
            <div>
              <strong>Pay with Razorpay</strong>
              <span>Cards, UPI, netbanking · international cards supported</span>
            </div>
          </label>
          {isDomesticIndia && (
            <label className={paymentMethod === 'cod' ? 'checkout-option checkout-option--active' : 'checkout-option'}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                disabled={!codAllowed}
                onChange={() => setPaymentMethod('cod')}
              />
              <div>
                <strong>Cash on delivery</strong>
                <span>
                  {codAllowed
                    ? 'India domestic only · COD charges added to shipping'
                    : 'Not available for this address'}
                </span>
              </div>
            </label>
          )}
          {isInternational && (
            <p className="checkout-panel--note">Cash on delivery is only available for India domestic orders.</p>
          )}
        </div>
      </section>

      <div className="checkout-actions checkout-actions--final">
        <Link to="/checkout/review" className="checkout-btn checkout-btn--ghost">Back</Link>
        <button
          type="button"
          className="checkout-btn checkout-btn--place"
          disabled={loading || !shippingQuote || Boolean(quoteError)}
          onClick={() => void placeOrder()}
        >
          {actionLabel}
        </button>
      </div>
    </CheckoutShell>
  )
}
