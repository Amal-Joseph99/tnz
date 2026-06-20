import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthPageShell } from '../components/AuthPageShell'
import { OTP_LENGTH, isValidOtp } from './authHelpers'

export function BuyerForgotOtpVerificationPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('A password reset OTP has been sent to your registered buyer email.')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  const handleVerify = () => {
    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit reset OTP.')
      return
    }

    setMessage('OTP verified. Create a new password.')
    window.setTimeout(() => navigate('/buyer/reset-password'), 600)
  }

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage('A new password reset OTP has been sent.')
    inputRefs.current[0]?.focus()
  }

  return (
    <AuthPageShell
      title="Verify reset OTP"
      subtitle="Enter the 6-digit code sent to your email."
      backTo="/buyer/forgot-password"
      otp
    >
      {message && <div className="auth-message auth-message--success">{message}</div>}
      {error && <div className="auth-message auth-message--error">{error}</div>}

      <form className="seller-otp-form" onSubmit={(event) => {
        event.preventDefault()
        handleVerify()
      }}>
        <div className="seller-otp-form__inputs" aria-label="6 digit buyer password reset OTP">
          {otp.map((digit, index) => (
            <input
              key={`buyer-reset-otp-${index + 1}`}
              ref={(element) => {
                inputRefs.current[index] = element
              }}
              value={digit}
              inputMode="numeric"
              maxLength={1}
              aria-label={`OTP digit ${index + 1}`}
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
        <button type="submit" className="seller-otp-form__verify">Verify OTP</button>
      </form>

      <div className="seller-otp-card__resend">
        {secondsLeft > 0 ? <span>Resend OTP in {secondsLeft}s</span> : <button type="button" onClick={handleResend}>Resend OTP</button>}
      </div>
    </AuthPageShell>
  )
}
