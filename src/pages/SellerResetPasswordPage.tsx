import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { isValidPassword } from './authHelpers'

export function SellerResetPasswordPage() {
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

    setSuccess('Seller password changed successfully. You are now signed in.')
    window.setTimeout(() => navigate('/seller/dashboard'), 700)
  }

  return (
    <AuthPageShell title="Create new password" backTo="/seller/forgot-password/verify">
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
    </AuthPageShell>
  )
}
