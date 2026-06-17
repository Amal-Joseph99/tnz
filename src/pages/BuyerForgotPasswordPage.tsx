import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isValidEmail } from './authHelpers'

export function BuyerForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!isValidEmail(email)) {
      setError('Enter your registered buyer email address.')
      return
    }

    setSuccess('Password reset OTP has been sent to your registered email.')
    window.setTimeout(() => navigate('/buyer/forgot-password/verify'), 700)
  }

  return (
    <section className="seller-login-page auth-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Buyer account</p>
            <h1>Forgot password</h1>
            <span>Enter your registered email to receive a 6-digit password reset OTP.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}>
            <label>
              Registered email
              <input value={email} type="email" placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button type="submit" className="seller-login__submit">Send reset OTP</button>
          </form>

          <p className="seller-login__signup">
            Remember password? <Link to="/buyer/signin">Buyer login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
