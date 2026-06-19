import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchSellerCountryOptions, type SellerCountryOption } from '../lib/sellerCountries'
import { supabase } from '../lib/supabase'
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

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    const fullPhone = `+${selectedCountry.isd_code}${localDigits}`

    setSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          account_type: 'seller',
          business_name: businessName.trim(),
          country_id: selectedCountry.id,
          iso_alpha2: selectedCountry.iso_alpha2,
          iso_alpha3: selectedCountry.iso_alpha3,
          isd_code: selectedCountry.isd_code,
          base_currency_code: selectedCountry.currency_code,
          phone: fullPhone,
        },
      },
    })

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess('Seller account created. Verify your email to continue.')
    window.setTimeout(() => navigate('/seller/verify-email'), 700)
  }

  return (
    <section className="seller-login-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Seller Central</p>
            <h1>Create seller account</h1>
            <span>Seller registration only. Buyers use <Link to="/buyer/signup">Buyer signup</Link>. Admin accounts are created in Supabase backend only.</span>
          </div>

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
                onChange={(event) => setBusinessName(event.target.value)}
              />
            </label>
            <label>
              Country
              <select
                value={countryId}
                disabled={loadingCountries}
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
              />
            </label>
            <label>
              Seller email
              <input value={email} type="email" placeholder="seller@example.com" onChange={(event) => setEmail(event.target.value)} />
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
                  disabled={!selectedCountry}
                  onChange={(event) => setPhoneLocal(event.target.value)}
                />
              </div>
            </label>
            <label>
              Password
              <input value={password} type="password" placeholder="Minimum 8 characters" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="seller-login__submit" disabled={submitting || loadingCountries}>
              {submitting ? 'Creating account...' : 'Create seller account'}
            </button>
          </form>

          <p className="seller-login__signup">
            Already registered? <Link to="/seller/signin">Seller login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
