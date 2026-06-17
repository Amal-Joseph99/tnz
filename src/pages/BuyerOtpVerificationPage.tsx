import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OTP_LENGTH, isValidOtp } from './authHelpers'

export function BuyerOtpVerificationPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('A 6-digit OTP has been sent to your buyer email address.')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

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

  const handleVerify = () => {
    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit email OTP.')
      return
    }

    setMessage('Email verified successfully. Signing you in.')
    window.setTimeout(() => navigate('/profile'), 700)
  }

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage('A new 6-digit OTP has been sent to your buyer email address.')
    inputRefs.current[0]?.focus()
  }

  return (
    <section className="seller-otp-page">
      <div className="seller-otp-card">
        <span className="seller-otp-card__eyebrow">Buyer account</span>
        <h1>Email OTP verification</h1>
        <p>Enter the 6-digit OTP sent to your registered email address.</p>

        {message && <div className="auth-message auth-message--success">{message}</div>}
        {error && <div className="auth-message auth-message--error">{error}</div>}

        <form className="seller-otp-form" onSubmit={(event) => {
          event.preventDefault()
          handleVerify()
        }}>
          <div className="seller-otp-form__inputs" aria-label="6 digit buyer email OTP">
            {otp.map((digit, index) => (
              <input
                key={`buyer-otp-${index + 1}`}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                aria-label={`OTP digit ${index + 1}`}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !otp[index] && index > 0) {
                    inputRefs.current[index - 1]?.focus()
                  }
                }}
              />
            ))}
          </div>

          <button type="submit" className="seller-otp-form__verify">Verify and sign in</button>
        </form>

        <div className="seller-otp-card__resend">
          {secondsLeft > 0 ? <span>Resend OTP in {secondsLeft}s</span> : <button type="button" onClick={handleResend}>Resend OTP</button>}
        </div>

        <Link to="/buyer/signup" className="seller-otp-card__back">Change buyer details</Link>
      </div>
    </section>
  )
}
