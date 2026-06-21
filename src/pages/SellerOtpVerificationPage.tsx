import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { normalizeAuthEmail, resendSignupOtp, verifySignupOtp } from '../lib/authOtp'
import { ensureSellerRegistration } from '../lib/sellerAuth'
import { verifyLoginPortal } from '../lib/portalAuth'
import { supabase } from '../lib/supabase'
import { getOtpValue, OTP_LENGTH, isValidOtp } from './authHelpers'

type SellerVerifyLocationState = {
  email?: string
}

export function SellerOtpVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = normalizeAuthEmail((location.state as SellerVerifyLocationState | null)?.email ?? '')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    email
      ? `A 6-digit code was sent to ${email}.`
      : 'Enter the 6-digit code from your seller signup email.',
  )
  const [verifying, setVerifying] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!email) {
      setError('Missing signup email. Start again from seller signup.')
    }
  }, [email])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)
    setError('')

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    if (!email) {
      setError('Missing signup email. Start again from seller signup.')
      return
    }

    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit email code.')
      return
    }

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    setVerifying(true)
    const verifyResult = await verifySignupOtp(email, getOtpValue(otp))

    if (!verifyResult.ok) {
      setVerifying(false)
      setError(verifyResult.message)
      return
    }

    const provisionResult = await ensureSellerRegistration()
    if (!provisionResult.ok) {
      await supabase.auth.signOut()
      setVerifying(false)
      setError(provisionResult.message)
      return
    }

    const portalCheck = await verifyLoginPortal('seller')
    if (!portalCheck.allowed) {
      await supabase.auth.signOut()
      setVerifying(false)
      setError(portalCheck.message)
      return
    }

    setVerifying(false)
    setMessage('Seller email verified successfully. Opening seller dashboard.')
    window.setTimeout(() => navigate('/seller/dashboard'), 700)
  }

  const handleResend = async () => {
    if (!email) {
      setError('Missing signup email. Start again from seller signup.')
      return
    }

    const result = await resendSignupOtp(email, '/seller/verify-email')
    if (!result.ok) {
      setError(result.message)
      return
    }

    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage(`A new 6-digit code was sent to ${email}. Check your inbox and spam folder.`)
    inputRefs.current[0]?.focus()
  }

  return (
    <AuthPageShell
      title="Email verification"
      subtitle="Enter the 6-digit code sent to your email."
      fallbackBack="/seller/signup"
      otp
    >
      {message && <div className="auth-message auth-message--success" role="status">{message}</div>}
      {error && <div className="auth-message auth-message--error" role="alert">{error}</div>}

      <form className="seller-otp-form" onSubmit={(event) => {
        event.preventDefault()
        void handleVerify()
      }}>
        <div className="seller-otp-form__inputs" aria-label="6 digit seller email code">
          {otp.map((digit, index) => (
            <input
              key={`seller-otp-${index + 1}`}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Code digit ${index + 1}`}
              disabled={!email || verifying}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event.key)}
            />
          ))}
        </div>

        <button type="submit" className="seller-otp-form__verify" disabled={!email || verifying}>
          {verifying ? 'Verifying...' : 'Verify and open dashboard'}
        </button>
      </form>

      <p className="auth-hint">
        Did not receive the email? Check spam or promotions, wait up to 2 minutes, then tap Resend code.
      </p>

      <div className="seller-otp-card__resend">
        {secondsLeft > 0 ? (
          <span>Resend code in {secondsLeft}s</span>
        ) : (
          <button type="button" onClick={() => void handleResend()} disabled={!email || verifying}>
            Resend code
          </button>
        )}
      </div>

      <Link to="/seller/signup" className="seller-otp-card__back">
        Change seller details
      </Link>
    </AuthPageShell>
  )
}
