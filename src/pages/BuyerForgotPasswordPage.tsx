import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { normalizeAuthEmail, sendPasswordResetOtp } from '../lib/authOtp'
import { isValidEmail } from './authHelpers'

export function BuyerForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!isValidEmail(email)) {
      setError('Enter your registered buyer email address.')
      return
    }

    setSubmitting(true)
    const result = await sendPasswordResetOtp(email)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const normalizedEmail = normalizeAuthEmail(email)
    setSuccess('Password reset OTP has been sent to your registered email.')
    window.setTimeout(
      () => navigate('/buyer/forgot-password/verify', { state: { email: normalizedEmail } }),
      700,
    )
  }

  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="Enter your email to receive a 6-digit reset code."
      fallbackBack="/buyer/signin"
    >
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form className="seller-login__form" onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}>
        <label>
          Registered email
          <input value={email} type="email" placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button type="submit" className="seller-login__submit" disabled={submitting}>
          {submitting ? 'Sending OTP...' : 'Send reset OTP'}
        </button>
      </form>

      <p className="seller-login__signup">
        Remember password? <Link to="/buyer/signin">Buyer login</Link>
      </p>
    </AuthPageShell>
  )
}
