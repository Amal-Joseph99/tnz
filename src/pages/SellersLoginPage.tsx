import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInSellerOrAdmin } from '../lib/sellerAuth'
import { isValidEmail } from './authHelpers'

export function SellersLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!isValidEmail(email)) {
      setError('Please enter a valid registered seller email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const result = await signInSellerOrAdmin(email, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    if (result.role === 'admin') {
      setSuccess('Login successful. Opening admin dashboard.')
      window.setTimeout(() => navigate('/admin/dashboard'), 600)
      return
    }

    setSuccess('Login successful. Opening seller dashboard.')
    window.setTimeout(() => navigate('/seller/dashboard'), 600)
  }

  return (
    <section className="seller-login-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Sell on AGTRENZ</p>
            <h1>Seller Login</h1>
            <span>Access is verified securely after login. Admin accounts are routed by backend role.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}>
            <label>
              Email address
              <input value={email} type="email" placeholder="seller@example.com" autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
            </label>

            <label>
              Password
              <input value={password} type="password" placeholder="Enter your password" autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
            </label>

            <div className="seller-login__options">
              <label>
                <input type="checkbox" />
                Remember me
              </label>
              <Link to="/seller/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="seller-login__submit" disabled={loading}>
              {loading ? 'Checking access...' : 'Login'}
            </button>
          </form>

          <p className="seller-login__signup">
            New to AGTRENZ selling? <Link to="/seller/signup">Create your seller account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
