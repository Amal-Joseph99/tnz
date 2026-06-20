import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { normalizeAuthEmail, resendSignupOtp, verifySignupOtp } from '../lib/authOtp'
import { getOtpValue, OTP_LENGTH, isValidOtp } from './authHelpers'

type BuyerVerifyLocationState = {
  email?: string
}

export function BuyerOtpVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = normalizeAuthEmail((location.state as BuyerVerifyLocationState | null)?.email ?? '')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    email
      ? `A 6-digit code was sent to ${email}.`
      : 'Enter the 6-digit code from your buyer signup email.',
  )
  const [verifying, setVerifying] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!email) {
      setError('Missing signup email. Start again from buyer signup.')
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

  const handleVerify = async () => {
    if (!email) {
      setError('Missing signup email. Start again from buyer signup.')
      return
    }

    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit email code.')
      return
    }

    setVerifying(true)
    const result = await verifySignupOtp(email, getOtpValue(otp))
    setVerifying(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Email verified successfully. Signing you in.')
    window.setTimeout(() => navigate('/profile'), 700)
  }

  const handleResend = async () => {
    if (!email) {
      setError('Missing signup email. Start again from buyer signup.')
      return
    }

    const result = await resendSignupOtp(email)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage(`A new 6-digit code was sent to ${email}.`)
    inputRefs.current[0]?.focus()
  }

  return (
    <AuthPageShell
      title="Email verification"
      subtitle="Enter the 6-digit code sent to your email."
      fallbackBack="/buyer/signup"
      otp
    >
      {message && <div className="auth-message auth-message--success">{message}</div>}
      {error && <div className="auth-message auth-message--error">{error}</div>}

      <form className="seller-otp-form" onSubmit={(event) => {
        event.preventDefault()
        void handleVerify()
      }}>
        <div className="seller-otp-form__inputs" aria-label="6 digit buyer email code">
          {otp.map((digit, index) => (
            <input
              key={`buyer-otp-${index + 1}`}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Code digit ${index + 1}`}
              disabled={!email || verifying}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !otp[index] && index > 0) {
                  inputRefs.current[index - 1]?.focus()
                }
              }}
            />
          ))}
        </div>

        <button type="submit" className="seller-otp-form__verify" disabled={!email || verifying}>
          {verifying ? 'Verifying...' : 'Verify and sign in'}
        </button>
      </form>

      <div className="seller-otp-card__resend">
        {secondsLeft > 0 ? (
          <span>Resend code in {secondsLeft}s</span>
        ) : (
          <button type="button" onClick={() => void handleResend()} disabled={!email || verifying}>
            Resend code
          </button>
        )}
      </div>

      <Link to="/buyer/signup" className="seller-otp-card__back">Change buyer details</Link>
    </AuthPageShell>
  )
}
