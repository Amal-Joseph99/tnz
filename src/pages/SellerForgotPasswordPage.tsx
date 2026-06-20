import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { isValidEmail } from './authHelpers'

export function SellerForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!isValidEmail(email)) {
      setError('Enter your registered seller email address.')
      return
    }

    setSuccess('Password reset OTP has been sent to your registered seller email.')
    window.setTimeout(() => navigate('/seller/forgot-password/verify'), 700)
  }

  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="Enter your email to receive a 6-digit reset code."
      backTo="/seller/signin"
    >
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form className="seller-login__form" onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}>
        <label>
          Registered seller email
          <input value={email} type="email" placeholder="seller@example.com" onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button type="submit" className="seller-login__submit">Send reset OTP</button>
      </form>

      <p className="seller-login__signup">
        Remember password? <Link to="/seller/signin">Seller login</Link>
      </p>
    </AuthPageShell>
  )
}
