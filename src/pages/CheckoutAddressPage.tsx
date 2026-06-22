import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckoutShell } from '../components/CheckoutShell'
import { useCheckout } from '../context/CheckoutContext'
import { fetchBuyerAccount, type BuyerAddress } from '../lib/marketplaceBackend'
import { fetchCheckoutCountries, fetchShiprocketServiceability } from '../lib/shiprocketShipping'
import { supabase } from '../lib/supabase'

function formatSavedAddress(address: BuyerAddress) {
  const lines = [
    address.address_line1,
    address.address_line2,
    `${address.city}, ${address.state} ${address.postcode}`,
    address.country_iso2,
  ].filter(Boolean)

  return lines.join(', ')
}

function isAddressComplete(input: {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  city: string
  state: string
  postcode: string
  countryIso2: string
}) {
  if (!input.fullName.trim() || !input.phone.trim() || !input.email.trim()) return false
  if (!input.addressLine1.trim() || !input.city.trim() || !input.state.trim()) return false
  if (input.countryIso2 === 'IN' && !input.postcode.trim()) return false
  return Boolean(input.countryIso2.trim())
}

export function CheckoutAddressPage() {
  const { items, delivery, setDelivery, setShippingQuote } = useCheckout()
  const [countries, setCountries] = useState<Array<{ countryName: string; isoAlpha2: string }>>([])
  const [savedAddresses, setSavedAddresses] = useState<BuyerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [fullName, setFullName] = useState(delivery?.fullName ?? '')
  const [phone, setPhone] = useState(delivery?.phone ?? '')
  const [email, setEmail] = useState(delivery?.email ?? '')
  const [addressLine1, setAddressLine1] = useState(delivery?.addressLine1 ?? '')
  const [addressLine2, setAddressLine2] = useState(delivery?.addressLine2 ?? '')
  const [city, setCity] = useState(delivery?.city ?? '')
  const [state, setState] = useState(delivery?.state ?? '')
  const [postcode, setPostcode] = useState(delivery?.postcode ?? '')
  const [countryIso2, setCountryIso2] = useState(delivery?.countryIso2 ?? 'IN')
  const [quoteReady, setQuoteReady] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const prefilledRef = useRef(false)

  const applyBuyerAddress = (address: BuyerAddress, accountEmail: string) => {
    setSelectedAddressId(address.id)
    setFullName(address.full_name)
    setPhone(address.phone)
    setEmail(accountEmail)
    setAddressLine1(address.address_line1)
    setAddressLine2(address.address_line2 ?? '')
    setCity(address.city)
    setState(address.state)
    setPostcode(address.postcode)
    setCountryIso2(address.country_iso2)
    setShippingQuote(null)
    setQuoteReady(false)
    setQuoteError('')
  }

  useEffect(() => {
    void Promise.all([
      fetchCheckoutCountries(),
      fetchBuyerAccount(),
      supabase?.auth.getSession(),
    ]).then(([countryRows, { profile, addresses }, sessionResult]) => {
      setCountries(countryRows)
      setSavedAddresses(addresses)

      const accountEmail = sessionResult?.data.session?.user.email ?? ''

      if (!prefilledRef.current) {
        prefilledRef.current = true

        if (delivery) {
          const matched = addresses.find((address) =>
            address.full_name === delivery.fullName
            && address.address_line1 === delivery.addressLine1
            && address.postcode === delivery.postcode,
          )
          if (matched) {
            setSelectedAddressId(matched.id)
          }
        } else {
          const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0]
          if (defaultAddress) {
            applyBuyerAddress(defaultAddress, accountEmail)
          } else {
            setEmail(accountEmail)
            if (profile) {
              setFullName(profile.full_name)
              setPhone(profile.phone ?? '')
            }
          }
        }
      }

      setLoadingAddresses(false)
    })
  }, [delivery])

  const sellerUserId = items[0]?.sellerUserId
  const isInternational = countryIso2 !== 'IN'

  useEffect(() => {
    if (!sellerUserId || items.length === 0) return
    if (!isAddressComplete({ fullName, phone, email, addressLine1, city, state, postcode, countryIso2 })) {
      setQuoteReady(false)
      setQuoteError('')
      setShippingQuote(null)
      return
    }
    if (!isInternational && !postcode.trim()) return

    const timer = window.setTimeout(() => {
      void fetchShiprocketServiceability({
        sellerUserId,
        deliveryPostcode: isInternational ? undefined : postcode.trim(),
        deliveryCountryIso2: countryIso2,
        paymentMethod: 'prepaid',
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }).then((result) => {
        if (!result.serviceable) {
          setShippingQuote(null)
          setQuoteReady(false)
          setQuoteError(result.message)
          return
        }

        setShippingQuote(result.quote)
        setQuoteReady(true)
        setQuoteError('')
      }).catch((error) => {
        setShippingQuote(null)
        setQuoteReady(false)
        setQuoteError(error instanceof Error ? error.message : 'Unable to fetch shipping rate.')
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [
    items,
    sellerUserId,
    fullName,
    phone,
    email,
    addressLine1,
    city,
    state,
    postcode,
    countryIso2,
    isInternational,
    setShippingQuote,
  ])

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

  const canContinue = quoteReady && isAddressComplete({
    fullName,
    phone,
    email,
    addressLine1,
    city,
    state,
    postcode,
    countryIso2,
  })

  return (
    <CheckoutShell showSummary={false}>
      <section className="checkout-panel">
        <div className="checkout-panel__header">
          <h2>Delivery address</h2>
        </div>

        {loadingAddresses ? (
          <p>Loading saved addresses...</p>
        ) : savedAddresses.length > 0 ? (
          <div className="checkout-saved-addresses">
            <p className="checkout-saved-addresses__label">Saved addresses</p>
            <div className="checkout-saved-addresses__list">
              {savedAddresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  className={
                    selectedAddressId === address.id
                      ? 'checkout-saved-address checkout-saved-address--active'
                      : 'checkout-saved-address'
                  }
                  onClick={() => applyBuyerAddress(address, email)}
                >
                  {address.is_default && <span>Default</span>}
                  <strong>{address.full_name}</strong>
                  <p>{formatSavedAddress(address)}</p>
                  <p>{address.phone}</p>
                </button>
              ))}
            </div>
            <Link to="/profile" className="checkout-saved-addresses__manage">Manage addresses</Link>
          </div>
        ) : (
          <p className="checkout-saved-addresses__empty">
            No saved address yet.{' '}
            <Link to="/profile">Add one in your profile</Link>
            {' '}to use it at checkout next time.
          </p>
        )}

        <form className="checkout-form checkout-form--grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(event) => {
                setSelectedAddressId(null)
                setFullName(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setSelectedAddressId(null)
                setPhone(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            />
          </label>
          <label className="checkout-form__full">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="checkout-form__full">
            Address line 1
            <input
              type="text"
              value={addressLine1}
              onChange={(event) => {
                setSelectedAddressId(null)
                setAddressLine1(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            />
          </label>
          <label className="checkout-form__full">
            Address line 2
            <input
              type="text"
              value={addressLine2}
              onChange={(event) => {
                setSelectedAddressId(null)
                setAddressLine2(event.target.value)
              }}
            />
          </label>
          <label>
            City
            <input
              type="text"
              value={city}
              onChange={(event) => {
                setSelectedAddressId(null)
                setCity(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            />
          </label>
          <label>
            State
            <input
              type="text"
              value={state}
              onChange={(event) => {
                setSelectedAddressId(null)
                setState(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            />
          </label>
          <label>
            PIN / postal code
            <input
              type="text"
              value={postcode}
              onChange={(event) => {
                setSelectedAddressId(null)
                setPostcode(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required={!isInternational}
            />
          </label>
          <label>
            Country
            <select
              value={countryIso2}
              onChange={(event) => {
                setSelectedAddressId(null)
                setCountryIso2(event.target.value)
                setQuoteReady(false)
                setQuoteError('')
              }}
              required
            >
              {countries.map((country) => (
                <option key={country.isoAlpha2} value={country.isoAlpha2}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </label>
        </form>
      </section>

      {quoteError && <div className="auth-message auth-message--error">{quoteError}</div>}

      <div className="checkout-actions">
        <Link to="/cart" className="checkout-btn checkout-btn--ghost">Back to cart</Link>
        {canContinue ? (
          <Link
            to="/checkout/review"
            className="checkout-btn"
            onClick={saveDelivery}
          >
            Continue to review
          </Link>
        ) : (
          <span className="checkout-btn checkout-btn--disabled" aria-disabled="true">
            Continue to review
          </span>
        )}
      </div>
    </CheckoutShell>
  )
}
