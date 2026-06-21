import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { PasswordField } from '../components/auth/PasswordField'
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
    <AuthPageShell
      fallbackBack="/"
      footer={
        <>
          <Link to="/seller/forgot-password">Forgot password?</Link>
          <Link to="/seller/signup">Create account</Link>
        </>
      }
    >
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form
        className="seller-login__form"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      >
        <label>
          Email address
          <input
            value={email}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button type="submit" className="seller-login__submit" disabled={loading}>
          {loading ? 'Checking access...' : 'Login'}
        </button>
      </form>
    </AuthPageShell>
  )
}
