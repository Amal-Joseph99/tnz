import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthPageShell } from '../components/AuthPageShell'
import { PasswordField } from '../components/auth/PasswordField'
import { normalizeAuthEmail } from '../lib/authOtp'
import { signUpBuyer } from '../lib/buyerAuth'
import { isValidEmail, isValidPassword } from './authHelpers'

export function SignUpPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!isValidPassword(password)) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const result = await signUpBuyer(name, email, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setSuccess('Buyer account created. Check your email for the 6-digit code.')
    window.setTimeout(() => navigate('/buyer/verify-email', { state: { email: normalizeAuthEmail(email) } }), 600)
  }

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Create your buyer account to shop on AGTRENZ."
      portal="buyer"
      fallbackBack="/"
      footer={
        <>
          <span />
          <Link to="/buyer/signin">Buyer login</Link>
        </>
      }
    >
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form className="seller-login__form" onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}>
        <label>
          Full name
          <input
            value={name}
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Email address
          <input
            value={email}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <button type="submit" className="seller-login__submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthPageShell>
  )
}
