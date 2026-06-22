import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import {
  fetchBuyerAccount,
  saveBuyerAddress,
  saveBuyerProfile,
  setBuyerAddressDefault,
  type BuyerAddress,
} from '../lib/marketplaceBackend'
import { fetchCheckoutCountries } from '../lib/shiprocketShipping'
import { supabase } from '../lib/supabase'

function formatAddress(address: BuyerAddress) {
  const lines = [
    address.address_line1,
    address.address_line2,
    `${address.city}, ${address.state} ${address.postcode}`,
    address.country_iso2,
  ].filter(Boolean)

  return lines.join(', ')
}

function emptyAddressForm(profileName: string, profilePhone: string) {
  return {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postcode: '',
    countryIso2: 'IN',
    fullName: profileName,
    phone: profilePhone,
  }
}

export function ProfilePage() {
  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [countries, setCountries] = useState<Array<{ countryName: string; isoAlpha2: string }>>([])
  const [addresses, setAddresses] = useState<BuyerAddress[]>([])
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postcode, setPostcode] = useState('')
  const [countryIso2, setCountryIso2] = useState('IN')
  const [addressFullName, setAddressFullName] = useState('')
  const [addressPhone, setAddressPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  const resetAddressForm = (profileName = fullName, profilePhone = phone) => {
    const empty = emptyAddressForm(profileName, profilePhone)
    setAddressLine1(empty.addressLine1)
    setAddressLine2(empty.addressLine2)
    setCity(empty.city)
    setState(empty.state)
    setPostcode(empty.postcode)
    setCountryIso2(empty.countryIso2)
    setAddressFullName(empty.fullName)
    setAddressPhone(empty.phone)
  }

  const loadAccount = async () => {
    const { profile, addresses: loaded } = await fetchBuyerAccount()
    if (profile) {
      setFullName(profile.full_name)
      setPhone(profile.phone ?? '')
      setDateOfBirth(profile.date_of_birth ?? '')
    }

    setAddresses(loaded)
    if (loaded.length === 0) {
      setShowAddressForm(true)
      resetAddressForm(profile?.full_name ?? fullName, profile?.phone ?? phone)
    } else {
      setShowAddressForm(false)
    }
  }

  useEffect(() => {
    void Promise.all([
      supabase?.auth.getSession(),
      fetchCheckoutCountries(),
      loadAccount(),
    ]).then(([sessionResult, countryRows]) => {
      setEmail(sessionResult?.data.session?.user.email ?? '')
      setEmailVerified(Boolean(sessionResult?.data.session?.user.email_confirmed_at))
      setCountries(countryRows)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setError('')
    setMessage('')
    setSavingProfile(true)
    const result = await saveBuyerProfile({
      fullName,
      phone,
      dateOfBirth: dateOfBirth || undefined,
    })
    setSavingProfile(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Profile saved.')
  }

  const handleSaveAddress = async () => {
    setError('')
    setMessage('')

    if (!addressFullName.trim() || !addressPhone.trim()) {
      setError('Add your name and phone.')
      return
    }

    if (!addressLine1.trim() || !city.trim() || !state.trim() || !postcode.trim()) {
      setError('Complete all required address fields.')
      return
    }

    setSavingAddress(true)
    const result = await saveBuyerAddress({
      label: 'Home',
      fullName: addressFullName.trim(),
      phone: addressPhone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postcode: postcode.trim(),
      countryIso2,
      isDefault: addresses.length === 0,
    })
    setSavingAddress(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    await loadAccount()
    setShowAddressForm(false)
    resetAddressForm()
  }

  const handleMakeDefault = async (address: BuyerAddress) => {
    setError('')
    setMessage('')
    setSavingAddress(true)
    const result = await setBuyerAddressDefault(address)
    setSavingAddress(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    await loadAccount()
  }

  const openNewAddressForm = () => {
    resetAddressForm()
    setShowAddressForm(true)
  }

  return (
    <BuyerAccountShell
      title="Profile"
      action={
        <button
          type="button"
          className="buyer-account__action"
          onClick={() => void handleSave()}
          disabled={savingProfile || loading}
        >
          {savingProfile ? 'Saving...' : 'Save changes'}
        </button>
      }
    >
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      {!loading && (
        <>
          <section className="buyer-panel">
            <div className="buyer-panel__header">
              <h2>Personal information</h2>
            </div>
            <form className="buyer-form buyer-form--grid" onSubmit={(event) => event.preventDefault()}>
              <label>
                Full name
                <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" />
              </label>
              <label>
                Email address
                <input type="email" value={email} readOnly />
              </label>
              <label>
                Phone number
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter your phone number" />
              </label>
              <label>
                Date of birth
                <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
              </label>
            </form>
          </section>

          <div className="buyer-panel-grid">
        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Addresses</h2>
          </div>

          {addresses.length > 0 && (
            <div className="buyer-address-list">
              {addresses.map((address) => (
                <article key={address.id} className="buyer-address-card">
                  {address.is_default && <span>Default</span>}
                  <strong>{address.full_name}</strong>
                  <p>{formatAddress(address)}</p>
                  <p>{address.phone}</p>
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => void handleMakeDefault(address)}
                      disabled={savingAddress || loading}
                    >
                      Make default
                    </button>
                  )}
                </article>
              ))}
              {!showAddressForm && (
                <button type="button" className="buyer-address-add" onClick={openNewAddressForm}>
                  Add new
                </button>
              )}
            </div>
          )}

          {showAddressForm && !loading && (
            <form
              className="buyer-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveAddress()
              }}
            >
              <label>
                Full name
                <input type="text" value={addressFullName} onChange={(event) => setAddressFullName(event.target.value)} required />
              </label>
              <label>
                Phone
                <input type="tel" value={addressPhone} onChange={(event) => setAddressPhone(event.target.value)} required />
              </label>
              <label>
                Address line 1
                <input type="text" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} required />
              </label>
              <label>
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
                Postcode
                <input type="text" value={postcode} onChange={(event) => setPostcode(event.target.value)} required />
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
              <div className="buyer-form__actions">
                <button type="submit" disabled={savingAddress || loading}>
                  {savingAddress ? 'Saving...' : 'Save'}
                </button>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    className="buyer-form__cancel"
                    onClick={() => {
                      setShowAddressForm(false)
                      resetAddressForm()
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Security</h2>
          </div>
          <div className="buyer-security-list">
            <div>
              <span>Password</span>
              <a href="/buyer/forgot-password">Change</a>
            </div>
            <div>
              <span>Email verification</span>
              <strong className="buyer-status">{emailVerified ? 'Verified' : 'Pending'}</strong>
            </div>
            <div>
              <span>Delete account</span>
              <Link to="/profile/delete-account" className="buyer-security-list__danger">
                Delete account
              </Link>
            </div>
          </div>
        </section>
          </div>
        </>
      )}
    </BuyerAccountShell>
  )
}
