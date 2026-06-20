import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { AuthPageShell } from '../components/AuthPageShell'
import { fetchSellerCountryOptions, type SellerCountryOption } from '../lib/sellerCountries'
import { normalizeAuthEmail } from '../lib/authOtp'
import { signUpSeller } from '../lib/sellerAuth'
import { isValidEmail, isValidPassword } from './authHelpers'

export function SellersSignupPage() {
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [countryId, setCountryId] = useState('')
  const [email, setEmail] = useState('')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [password, setPassword] = useState('')
  const [countries, setCountries] = useState<SellerCountryOption[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedCountry = useMemo(
    () => countries.find((country) => String(country.id) === countryId) ?? null,
    [countries, countryId],
  )

  useEffect(() => {
    let active = true

    fetchSellerCountryOptions()
      .then((options) => {
        if (active) {
          setCountries(options)
        }
      })
      .catch((fetchError: Error) => {
        if (active) {
          setError(fetchError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCountries(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!businessName.trim()) {
      setError('Please enter your business name.')
      return
    }

    if (!selectedCountry) {
      setError('Please select your business country.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid seller email address.')
      return
    }

    const localDigits = phoneLocal.replace(/\D/g, '')
    if (localDigits.length < 6 || localDigits.length > 14) {
      setError('Please enter a valid phone number.')
      return
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    const result = await signUpSeller({
      businessName,
      country: selectedCountry,
      email,
      phoneLocal,
      password,
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setSuccess('Seller account created. Check your email for the 6-digit code.')
    window.setTimeout(() => navigate('/seller/verify-email', { state: { email: normalizeAuthEmail(email) } }), 700)
  }

  return (
    <AuthPageShell title="Create account" fallbackBack="/">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form className="seller-login__form" onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}>
        <label>
          Business name
          <input
            value={businessName}
            type="text"
            placeholder="Your store or company name"
            autoComplete="organization"
            required
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </label>
        <label>
          Country
          <select
            value={countryId}
            disabled={loadingCountries}
            required
            onChange={(event) => setCountryId(event.target.value)}
          >
            <option value="">{loadingCountries ? 'Loading countries...' : 'Select country'}</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.country_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Base currency (locked)
          <input
            type="text"
            value={selectedCountry ? `${selectedCountry.currency_code} · ${selectedCountry.country_name}` : 'Select a country first'}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
        </label>
        <label>
          Seller email
          <input
            value={email}
            type="email"
            placeholder="seller@example.com"
            autoComplete="email"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Phone number
          <div className="seller-phone-input">
            <span className="seller-phone-input__prefix">
              {selectedCountry ? `+${selectedCountry.isd_code}` : '+--'}
            </span>
            <input
              value={phoneLocal}
              type="tel"
              placeholder="98765 43210"
              autoComplete="tel-national"
              required
              disabled={!selectedCountry}
              onChange={(event) => setPhoneLocal(event.target.value)}
            />
          </div>
        </label>
        <label>
          Password
          <input
            value={password}
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="seller-login__submit" disabled={submitting || loadingCountries}>
          {submitting ? 'Creating account...' : 'Create seller account'}
        </button>
      </form>

      <p className="seller-login__signup">
        Already registered? <Link to="/seller/signin">Seller login</Link>
      </p>
    </AuthPageShell>
  )
}
