import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { PasswordField } from '../components/auth/PasswordField'
import { updateAuthenticatedPassword } from '../lib/authOtp'
import { verifyLoginPortal } from '../lib/portalAuth'
import { supabase } from '../lib/supabase'
import { isValidPassword } from './authHelpers'

export function BuyerResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
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

    setSubmitting(true)
    const result = await updateAuthenticatedPassword(password)
    if (!result.ok) {
      setSubmitting(false)
      setError(result.message)
      return
    }

    const portalCheck = await verifyLoginPortal('buyer')
    if (!portalCheck.allowed) {
      if (supabase) await supabase.auth.signOut()
      setSubmitting(false)
      setError(portalCheck.message)
      return
    }

    setSubmitting(false)
    setSuccess('Password changed successfully. You are now signed in.')
    window.setTimeout(() => navigate('/profile'), 700)
  }

  return (
    <AuthPageShell title="Create new password" fallbackBack="/buyer/forgot-password/verify">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {success && <div className="auth-message auth-message--success">{success}</div>}

      <form className="seller-login__form" onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}>
        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter new password"
          autoComplete="new-password"
        />
        <button type="submit" className="seller-login__submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save password and sign in'}
        </button>
      </form>
    </AuthPageShell>
  )
}
