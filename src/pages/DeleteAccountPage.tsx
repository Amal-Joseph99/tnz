import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import {
  completeBuyerAccountDeletion,
  fetchAccountDeletionReasons,
  prepareBuyerAccountDeletion,
  type AccountDeletionReason,
} from '../lib/marketplaceBackend'
import {
  normalizeAuthEmail,
  sendAccountDeletionOtp,
  verifyAccountDeletionOtp,
} from '../lib/authOtp'
import { supabase } from '../lib/supabase'
import { getOtpValue, isValidOtp, OTP_LENGTH } from './authHelpers'

type Step = 'form' | 'otp' | 'success'

export function DeleteAccountPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('form')
  const [reasons, setReasons] = useState<AccountDeletionReason[]>([])
  const [reasonKey, setReasonKey] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [email, setEmail] = useState('')
  const [requestId, setRequestId] = useState<number | null>(null)
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const selectedReason = reasons.find((reason) => reason.reasonKey === reasonKey)

  useEffect(() => {
    void Promise.all([
      fetchAccountDeletionReasons(),
      supabase?.auth.getSession(),
    ]).then(([reasonRows, sessionResult]) => {
      setReasons(reasonRows)
      if (reasonRows[0]) {
        setReasonKey(reasonRows[0].reasonKey)
      }
      setEmail(normalizeAuthEmail(sessionResult?.data.session?.user.email ?? ''))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [step, secondsLeft])

  const handleProceed = async () => {
    setError('')
    setMessage('')

    if (!accepted) {
      setError('Please confirm that you understand your account and records will be removed.')
      return
    }

    if (selectedReason?.requiresCustomText && !customReason.trim()) {
      setError('Please describe your reason for deleting the account.')
      return
    }

    setSubmitting(true)
    const prepared = await prepareBuyerAccountDeletion({
      reasonKey,
      customReason: customReason.trim() || undefined,
      acceptedTerms: accepted,
    })
    setSubmitting(false)

    if (!prepared.ok) {
      setError(prepared.message)
      return
    }

    setRequestId(prepared.requestId)
    setSubmitting(true)
    const otpResult = await sendAccountDeletionOtp(email)
    setSubmitting(false)

    if (!otpResult.ok) {
      setError(otpResult.message)
      return
    }

    setStep('otp')
    setSecondsLeft(30)
    setMessage(`A 6-digit verification code was sent to ${email}.`)
    inputRefs.current[0]?.focus()
  }

  const handleResend = async () => {
    if (!email) return

    setSubmitting(true)
    const result = await sendAccountDeletionOtp(email)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setOtp(Array(OTP_LENGTH).fill(''))
    setSecondsLeft(30)
    setError('')
    setMessage(`A new verification code was sent to ${email}.`)
    inputRefs.current[0]?.focus()
  }

  const handleSubmitDeletion = async () => {
    if (!email || requestId === null) {
      setError('Your deletion request expired. Start again.')
      return
    }

    if (!isValidOtp(otp)) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setSubmitting(true)
    setError('')

    const verified = await verifyAccountDeletionOtp(email, getOtpValue(otp))
    if (!verified.ok) {
      setSubmitting(false)
      setError(verified.message)
      return
    }

    const completed = await completeBuyerAccountDeletion(requestId)
    setSubmitting(false)

    if (!completed.ok) {
      setError(completed.message)
      return
    }

    await supabase?.auth.signOut()
    setStep('success')
    window.setTimeout(() => navigate('/'), 2200)
  }

  return (
    <BuyerAccountShell
      title="Delete account"
      subtitle="Permanently remove your buyer account and all associated records."
    >
      {loading && <p>Loading account removal options...</p>}
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && step !== 'success' && <div className="auth-message auth-message--success">{message}</div>}

      {step === 'form' && !loading && (
        <section className="buyer-panel buyer-panel--delete-account">
          <div className="buyer-panel__header">
            <h2>Before you continue</h2>
            <p>Account removal is permanent. Your profile, addresses, orders, and notifications will be deleted.</p>
          </div>

          <form
            className="buyer-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleProceed()
            }}
          >
            <label>
              Reason for deleting your account
              <select
                value={reasonKey}
                onChange={(event) => setReasonKey(event.target.value)}
                disabled={submitting}
              >
                {reasons.map((reason) => (
                  <option key={reason.reasonKey} value={reason.reasonKey}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedReason?.requiresCustomText && (
              <label>
                Tell us more
                <textarea
                  value={customReason}
                  onChange={(event) => setCustomReason(event.target.value)}
                  placeholder="Describe your reason"
                  rows={4}
                  disabled={submitting}
                />
              </label>
            )}

            <label className="buyer-form__checkbox">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                disabled={submitting}
              />
              <span>
                I understand that account removal will permanently delete all records associated with my account on AGTRENZ.
              </span>
            </label>

            <button type="submit" className="buyer-account__action buyer-account__action--danger" disabled={submitting}>
              {submitting ? 'Processing...' : 'Proceed to delete'}
            </button>
          </form>
        </section>
      )}

      {step === 'otp' && (
        <section className="buyer-panel buyer-panel--delete-account">
          <div className="buyer-panel__header">
            <h2>Verify your email</h2>
            <p>Enter the 6-digit code sent to {email} to confirm account removal.</p>
          </div>

          <form
            className="seller-otp-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmitDeletion()
            }}
          >
            <div className="seller-otp-form__inputs" aria-label="6 digit account deletion OTP">
              {otp.map((digit, index) => (
                <input
                  key={`delete-account-otp-${index + 1}`}
                  ref={(element) => {
                    inputRefs.current[index] = element
                  }}
                  value={digit}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${index + 1}`}
                  disabled={submitting}
                  onChange={(event) => {
                    const nextOtp = [...otp]
                    nextOtp[index] = event.target.value.replace(/\D/g, '').slice(-1)
                    setOtp(nextOtp)
                    setError('')
                    if (nextOtp[index] && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !otp[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus()
                    }
                  }}
                />
              ))}
            </div>

            <button type="submit" className="seller-otp-form__verify" disabled={submitting}>
              {submitting ? 'Removing account...' : 'Submit'}
            </button>
          </form>

          <div className="seller-otp-card__resend">
            {secondsLeft > 0 ? (
              <span>Resend OTP in {secondsLeft}s</span>
            ) : (
              <button type="button" onClick={() => void handleResend()} disabled={submitting}>
                Resend OTP
              </button>
            )}
          </div>
        </section>
      )}

      {step === 'success' && (
        <div className="confirm-dialog__backdrop confirm-dialog__backdrop--inline" role="presentation">
          <div className="confirm-dialog" role="alertdialog" aria-modal="true">
            <h2>Account removed successfully</h2>
            <p>Your account and associated records have been permanently deleted. Redirecting to the home page...</p>
          </div>
        </div>
      )}
    </BuyerAccountShell>
  )
}
