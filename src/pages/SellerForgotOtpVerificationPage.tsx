import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { normalizeAuthEmail, sendPasswordResetOtp, verifyRecoveryOtp } from '../lib/authOtp'
import { getOtpValue, OTP_LENGTH, isValidOtp } from './authHelpers'

type ResetVerifyLocationState = {
  email?: string
}

export function SellerForgotOtpVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = normalizeAuthEmail((location.state as ResetVerifyLocationState | null)?.email ?? '')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    email
      ? `A password reset OTP was sent to ${email}.`
      : 'Enter the 6-digit reset code from your email.',
  )
  const [verifying, setVerifying] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!email) {
      setError('Missing email. Start again from forgot password.')
    }
  }, [email])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const handleVerify = async () => {
    if (!email) {
      setError('Missing email. Start again from forgot password.')
      return
    }

    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit reset OTP.')
      return
    }

    setVerifying(true)
    const result = await verifyRecoveryOtp(email, getOtpValue(otp))
    setVerifying(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('OTP verified. Create a new seller password.')
    window.setTimeout(() => navigate('/seller/reset-password'), 600)
  }

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Start again from forgot password.')
      return
    }

    const result = await sendPasswordResetOtp(email)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage(`A new password reset OTP was sent to ${email}.`)
    inputRefs.current[0]?.focus()
  }

  return (
    <AuthPageShell
      title="Verify reset OTP"
      subtitle="Enter the 6-digit code sent to your email."
      fallbackBack="/seller/forgot-password"
      otp
    >
      {message && <div className="auth-message auth-message--success">{message}</div>}
      {error && <div className="auth-message auth-message--error">{error}</div>}

      <form className="seller-otp-form" onSubmit={(event) => {
        event.preventDefault()
        void handleVerify()
      }}>
        <div className="seller-otp-form__inputs" aria-label="6 digit seller password reset OTP">
          {otp.map((digit, index) => (
            <input
              key={`seller-reset-otp-${index + 1}`}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              maxLength={1}
              aria-label={`OTP digit ${index + 1}`}
              disabled={!email || verifying}
              onChange={(event) => {
                const nextOtp = [...otp]
                nextOtp[index] = event.target.value.replace(/\D/g, '').slice(-1)
                setOtp(nextOtp)
                setError('')
                if (nextOtp[index] && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
              }}
            />
          ))}
        </div>
        <button type="submit" className="seller-otp-form__verify" disabled={!email || verifying}>
          {verifying ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>

      <div className="seller-otp-card__resend">
        {secondsLeft > 0 ? (
          <span>Resend OTP in {secondsLeft}s</span>
        ) : (
          <button type="button" onClick={() => void handleResend()} disabled={!email || verifying}>
            Resend OTP
          </button>
        )}
      </div>
    </AuthPageShell>
  )
}
