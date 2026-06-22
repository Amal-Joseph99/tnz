import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { useCurrency } from '../context/CurrencyContext'
import { fetchCheckoutCountries, fetchShiprocketServiceability } from '../lib/shiprocketShipping'

export function CheckoutAddressPage() {
  const { items, delivery, setDelivery, paymentMethod, shippingQuote, setShippingQuote } = useCheckout()
  const { formatDisplayAmount, toDisplayListingAmount } = useCurrency()
  const [countries, setCountries] = useState<Array<{ countryName: string; isoAlpha2: string }>>([])
  const [fullName, setFullName] = useState(delivery?.fullName ?? '')
  const [phone, setPhone] = useState(delivery?.phone ?? '')
  const [email, setEmail] = useState(delivery?.email ?? '')
  const [addressLine1, setAddressLine1] = useState(delivery?.addressLine1 ?? '')
  const [addressLine2, setAddressLine2] = useState(delivery?.addressLine2 ?? '')
  const [city, setCity] = useState(delivery?.city ?? '')
  const [state, setState] = useState(delivery?.state ?? '')
  const [postcode, setPostcode] = useState(delivery?.postcode ?? '')
  const [countryIso2, setCountryIso2] = useState(delivery?.countryIso2 ?? 'IN')
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    void fetchCheckoutCountries().then(setCountries)
  }, [])

  const sellerUserId = items[0]?.sellerUserId
  const isInternational = countryIso2 !== 'IN'
  const shiprocketPaymentMethod = paymentMethod === 'cod' ? 'cod' : 'prepaid'
  const refreshQuote = async () => {
    if (!sellerUserId || !countryIso2) return
    if (!isInternational && !postcode.trim()) return

    setLoadingQuote(true)
    setQuoteError('')

    try {
      const result = await fetchShiprocketServiceability({
        sellerUserId,
        deliveryPostcode: isInternational ? undefined : postcode.trim(),
        deliveryCountryIso2: countryIso2,
        paymentMethod: shiprocketPaymentMethod,
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      })

      if (!result.serviceable) {
        setShippingQuote(null)
        setQuoteError(result.message)
        return
      }

      setShippingQuote(result.quote)
    } catch (error) {
      setShippingQuote(null)
      setQuoteError(error instanceof Error ? error.message : 'Unable to fetch shipping rate.')
    } finally {
      setLoadingQuote(false)
    }
  }

  useEffect(() => {
    if (items.length === 0) return
    const timer = window.setTimeout(() => {
      void refreshQuote()
    }, 400)
    return () => window.clearTimeout(timer)
  }, [items, countryIso2, postcode, paymentMethod, sellerUserId])

  const saveDelivery = () => {
    setDelivery({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      postcode: postcode.trim(),
      countryIso2,
    })
  }

  return (
    <CheckoutShell>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Delivery address</h2>
        </div>

        <form className="checkout-form checkout-form--grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Phone
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </label>
          <label className="checkout-form__full">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="checkout-form__full">
            Address line 1
            <input type="text" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} required />
          </label>
          <label className="checkout-form__full">
            Address line 2
            <input type="text" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
          </label>
          <label>
            City
            <input type="text" value={city} onChange={(event) => setCity(event.target.value)} required />
          </label>
          <label>
            State
            <input type="text" value={state} onChange={(event) => setState(event.target.value)} required />
          </label>
          <label>
            PIN / postal code
            <input type="text" value={postcode} onChange={(event) => setPostcode(event.target.value)} required={!isInternational} />
          </label>
          <label>
            Country
            <select value={countryIso2} onChange={(event) => setCountryIso2(event.target.value)} required>
              {countries.map((country) => (
                <option key={country.isoAlpha2} value={country.isoAlpha2}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Shiprocket rate</h2>
        </div>
        {loadingQuote && <p>Fetching live shipping rate...</p>}
        {quoteError && <div className="auth-message auth-message--error">{quoteError}</div>}
        {shippingQuote && (
          <div className="checkout-shipping-quote">
            <div><span>Lane</span><strong>{shippingQuote.shippingLane === 'india_domestic' ? 'India domestic' : 'India → international'}</strong></div>
            <div><span>Courier</span><strong>{shippingQuote.courierName ?? 'Lowest rate'}</strong></div>
            <div><span>Shipping</span><strong>{formatDisplayAmount(toDisplayListingAmount(shippingQuote.shippingCharge, 'INR'))}</strong></div>
            {shiprocketPaymentMethod === 'cod' && (
              <div><span>COD charges</span><strong>{formatDisplayAmount(toDisplayListingAmount(shippingQuote.codCharges, 'INR'))}</strong></div>
            )}
            <div><span>Total shipping</span><strong>{formatDisplayAmount(toDisplayListingAmount(shippingQuote.totalShippingCharge, 'INR'))}</strong></div>
            <div><span>Estimated delivery</span><strong>{shippingQuote.estimatedDelivery ?? '—'}</strong></div>
          </div>
        )}
      </section>

      <div className="checkout-actions">
        <Link to="/cart" className="checkout-btn checkout-btn--ghost">Back to cart</Link>
        <Link
          to="/checkout/payment"
          className="checkout-btn"
          onClick={saveDelivery}
          aria-disabled={!shippingQuote}
        >
          Continue
        </Link>
      </div>
    </CheckoutShell>
  )
}
