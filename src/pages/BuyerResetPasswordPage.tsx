import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isValidPassword } from './authHelpers'

export function BuyerResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = () => {
    setError('')
    setSuccess('')

    if (!isValidPassword(password)) {
      setError('New password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSuccess('Password changed successfully. You are now signed in.')
    window.setTimeout(() => navigate('/profile'), 700)
  }

  return (
    <section className="seller-login-page auth-page">
      <div className="seller-login">
        <div className="seller-login__card">
          <div className="seller-login__header">
            <p>Buyer account</p>
            <h1>Create new password</h1>
            <span>Set a secure new password for your buyer account.</span>
          </div>

          {error && <div className="auth-message auth-message--error">{error}</div>}
          {success && <div className="auth-message auth-message--success">{success}</div>}

          <form className="seller-login__form" onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}>
            <label>
              New password
              <input value={password} type="password" placeholder="Minimum 8 characters" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              Confirm password
              <input value={confirmPassword} type="password" placeholder="Re-enter new password" onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <button type="submit" className="seller-login__submit">Save password and sign in</button>
          </form>
        </div>
      </div>
    </section>
  )
}
