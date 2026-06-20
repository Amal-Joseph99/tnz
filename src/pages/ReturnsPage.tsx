import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { checkReturnEligibility, createReturnRequest } from '../lib/marketplaceBackend'

export function ReturnsPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [eligibility, setEligibility] = useState<Awaited<ReturnType<typeof checkReturnEligibility>> | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheck = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setEligibility(null)
    setMessage('')

    const result = await checkReturnEligibility(orderNumber.trim(), email.trim())
    setEligibility(result)
    setLoading(false)

    if (!result.eligible) {
      setError(result.message ?? 'This order is not eligible for return.')
    }
  }

  const handleSubmitReturn = async (event: FormEvent) => {
    event.preventDefault()
    if (!eligibility?.orderId) return

    setLoading(true)
    setError('')

    const result = await createReturnRequest(eligibility.orderId, reason.trim())
    setLoading(false)

    if (!result.ok) {
      if (result.message.toLowerCase().includes('authentication')) {
        setError('Please sign in to submit a return request for this order.')
        return
      }
      setError(result.message)
      return
    }

    setMessage('Return request submitted. Our team will review it shortly.')
    setReason('')
  }

  return (
    <PageShell
      eyebrow="Support"
      title="Returns"
      subtitle="Start a return, review return eligibility, and understand refund timelines."
    >
      <div className="returns-layout">
        <section className="returns-card">
          <h2>Start a return</h2>
          <p>Enter your order number and checkout email to check eligibility.</p>
          {error && <div className="auth-message auth-message--error">{error}</div>}
          {message && <div className="auth-message auth-message--success">{message}</div>}
          <form onSubmit={(event) => void handleCheck(event)}>
            <label>
              Order number
              <input type="text" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Example: AGT-20260618-000001" required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Used during checkout" required />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check eligibility'}</button>
          </form>

          {eligibility?.eligible && (
            <form onSubmit={(event) => void handleSubmitReturn(event)} style={{ marginTop: '1.5rem' }}>
              <p>Order <strong>{eligibility.orderNumber}</strong> is eligible for return.</p>
              {eligibility.requiresLogin && (
                <p>
                  <Link to="/buyer/signin">Sign in</Link> with the buyer account that placed this order to submit the request.
                </p>
              )}
              <label>
                Reason for return
                <textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} required />
              </label>
              <button type="submit" disabled={loading || !reason.trim()}>Submit return request</button>
            </form>
          )}
        </section>

        <section className="returns-card">
          <h2>Return process</h2>
          <ol className="returns-steps">
            <li><strong>Request</strong><span>Select the item and reason.</span></li>
            <li><strong>Pickup or drop-off</strong><span>Choose the available return method.</span></li>
            <li><strong>Refund</strong><span>Refund is processed after inspection approval.</span></li>
          </ol>
        </section>
      </div>
    </PageShell>
  )
}
