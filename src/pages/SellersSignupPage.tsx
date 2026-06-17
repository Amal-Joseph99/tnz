import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { countries, isValidEmail, isValidPassword, isValidPhone } from './authHelpers'

export function SellersSignupPage() {
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [country, setCountry] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!businessName.trim()) {
      setError('Please enter your business name.')
      return
    }

    if (!country) {
      setError('Please select your business country.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid seller email address.')
      return
    }

    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSuccess('Seller account details accepted. Email OTP has been sent.')
    window.setTimeout(() => navigate('/seller/verify-email'), 700)
  }

  return (
    <section className="seller-login-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Seller Central</p>
            <h1>Create seller account</h1>
            <span>Register your business and verify your email before entering the seller dashboard.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}>
            <label>
              Business name
              <input value={businessName} type="text" placeholder="Your store or company name" onChange={(event) => setBusinessName(event.target.value)} />
            </label>
            <label>
              Country
              <select value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="">Select country</option>
                {countries.map((countryName) => (
                  <option key={countryName} value={countryName}>{countryName}</option>
                ))}
              </select>
            </label>
            <label>
              Seller email
              <input value={email} type="email" placeholder="seller@example.com" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Phone number
              <input value={phone} type="tel" placeholder="+91 98765 43210" onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label>
              Password
              <input value={password} type="password" placeholder="Minimum 8 characters" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" className="seller-login__submit">Create seller account</button>
          </form>

          <p className="seller-login__signup">
            Already registered? <Link to="/seller/signin">Seller login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
