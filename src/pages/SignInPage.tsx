import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { signInBuyer } from '../lib/buyerAuth'
import { isValidEmail } from './authHelpers'

export function SignInPage() {
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
      setError('Please enter a valid registered email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    const result = await signInBuyer(email, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setSuccess('Buyer login successful. Redirecting to your profile.')
    window.setTimeout(() => navigate('/profile'), 600)
  }

  return (
    <section className="seller-login-page auth-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Buyer account</p>
            <h1>Buyer login</h1>
            <span>Buyer access only. Sellers and admins must use <Link to="/seller/signin">Seller login</Link>.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}>
            <label>
              Email address
              <input value={email} type="email" placeholder="you@example.com" autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Password
              <input value={password} type="password" placeholder="Enter your password" autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <div className="seller-login__options">
              <span />
              <Link to="/buyer/forgot-password">Forgot password?</Link>
            </div>
            <button type="submit" className="seller-login__submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Buyer login'}
            </button>
          </form>

          <p className="seller-login__signup">
            New customer? <Link to="/buyer/signup">Create buyer account</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
