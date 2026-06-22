import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { trackShiprocketOrder } from '../lib/shiprocketShipping'

export function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') ?? '')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof trackShiprocketOrder>> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const nextOrderNumber = searchParams.get('orderNumber')
    if (nextOrderNumber) {
      setOrderNumber(nextOrderNumber)
    }
  }, [searchParams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setResult(null)

    try {
      const response = await trackShiprocketOrder({
        orderNumber: orderNumber.trim(),
        email: email.trim(),
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to track order.')
    }
  }

  return (
    <section className="track-order-page">
      <div className="container track-order-page__inner">
        <header className="track-order-page__header">
          <h1>Track order</h1>
        </header>

        <div className="track-order-layout">
          <section className="track-order-form-panel">
            <form onSubmit={(event) => void handleSubmit(event)}>
              <label>
                Order number
                <input
                  type="text"
                  placeholder="AGT-YYYYMMDD-000001"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  required
                />
              </label>
              <label>
                Checkout email
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <button type="submit">Track</button>
            </form>
          </section>

          {error && <div className="auth-message auth-message--error">{error}</div>}

          {result && (
            <section className="track-order-result-panel">
              <p><strong>{result.orderNumber}</strong></p>
              <p>{result.status.replaceAll('_', ' ')}</p>
              {result.awbCode && <p>AWB: {result.awbCode}</p>}
              {result.tracking ? (
                <pre className="track-order-json">{JSON.stringify(result.tracking, null, 2)}</pre>
              ) : (
                <p>{result.message ?? 'No tracking data yet.'}</p>
              )}
              <div className="track-order-result__actions">
                <Link to="/buyer/signin">Sign in for order history</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
