import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { fetchBuyerAccount, saveBuyerAddress, saveBuyerProfile, type BuyerAddress } from '../lib/marketplaceBackend'
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

export function ProfilePage() {
  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [countries, setCountries] = useState<Array<{ countryName: string; isoAlpha2: string }>>([])
  const [defaultAddress, setDefaultAddress] = useState<BuyerAddress | null>(null)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postcode, setPostcode] = useState('')
  const [countryIso2, setCountryIso2] = useState('IN')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  const loadAccount = async () => {
    const { profile, addresses } = await fetchBuyerAccount()
    if (profile) {
      setFullName(profile.full_name)
      setPhone(profile.phone ?? '')
      setDateOfBirth(profile.date_of_birth ?? '')
    }

    const savedDefault = addresses.find((address) => address.is_default) ?? addresses[0] ?? null
    setDefaultAddress(savedDefault)

    if (savedDefault) {
      setAddressLine1(savedDefault.address_line1)
      setAddressLine2(savedDefault.address_line2 ?? '')
      setCity(savedDefault.city)
      setState(savedDefault.state)
      setPostcode(savedDefault.postcode)
      setCountryIso2(savedDefault.country_iso2)
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

  const handleSaveDefaultAddress = async () => {
    setError('')
    setMessage('')

    if (!fullName.trim() || !phone.trim()) {
      setError('Add your name and phone before saving a default address.')
      return
    }

    if (!addressLine1.trim() || !city.trim() || !state.trim() || !postcode.trim()) {
      setError('Complete all required address fields.')
      return
    }

    setSavingAddress(true)
    const result = await saveBuyerAddress({
      id: defaultAddress?.id,
      label: 'Default',
      fullName,
      phone,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postcode: postcode.trim(),
      countryIso2,
      isDefault: true,
    })
    setSavingAddress(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    await loadAccount()
    setMessage('Default address saved.')
  }

  return (
    <BuyerAccountShell
      title="Profile"
      subtitle="Manage your personal information, saved addresses, and account security."
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
      {loading && <p>Loading profile...</p>}
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="buyer-panel">
        <div className="buyer-panel__header">
          <h2>Personal information</h2>
          <p>Keep your details accurate for faster checkout and delivery updates.</p>
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
            <h2>Default address</h2>
            <p>Used for delivery estimates and checkout.</p>
          </div>

          {defaultAddress && (
            <div className="buyer-address-summary">
              <strong>{defaultAddress.full_name}</strong>
              <p>{formatAddress(defaultAddress)}</p>
              <p>{defaultAddress.phone}</p>
            </div>
          )}

          <form className="buyer-form" onSubmit={(event) => {
            event.preventDefault()
            void handleSaveDefaultAddress()
          }}>
            <label>
              Address line 1
              <input type="text" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} placeholder="House number and street" required />
            </label>
            <label>
              Address line 2
              <input type="text" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} placeholder="Apartment, suite, etc. (optional)" />
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
            <button type="submit" disabled={savingAddress || loading}>
              {savingAddress ? 'Saving address...' : defaultAddress ? 'Update default address' : 'Save default address'}
            </button>
          </form>
        </section>

        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Security</h2>
            <p>Review login and password settings.</p>
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
    </BuyerAccountShell>
  )
}
