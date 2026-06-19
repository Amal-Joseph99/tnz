import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

const timeline = [
  { label: 'Order placed', detail: 'Jun 14, 2026 · 10:42 AM', done: true },
  { label: 'Payment confirmed', detail: 'Jun 14, 2026 · 10:43 AM', done: true },
  { label: 'Seller preparing', detail: 'In progress at AGTRENZ Partner Store', done: true },
  { label: 'Shipped', detail: 'Expected Jun 18', done: false },
  { label: 'Out for delivery', detail: 'Pending', done: false },
  { label: 'Delivered', detail: 'Estimated Jun 20', done: false },
]

export function TrackOrderPage() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [tracked, setTracked] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (orderId.trim() && email.trim()) {
      setTracked(true)
    }
  }

  return (
    <section className="track-order-page">
      <div className="container track-order-page__inner">
        <header className="track-order-page__header">
          <span>Orders</span>
          <h1>Track order</h1>
          <p>Enter your order ID and email address to check delivery status.</p>
        </header>

        <div className="track-order-layout">
          <section className="track-order-form-panel">
            <h2>Order lookup</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Order ID
                <input
                  type="text"
                  placeholder="Example: AGT-10291"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button type="submit">Track order</button>
            </form>
          </section>

          {tracked && (
            <section className="track-order-result-panel">
              <div className="track-order-result__header">
                <div>
                  <span>Order #AGT-10291</span>
                  <h2>Wireless headphones and travel pouch</h2>
                  <p>2 items · Paid online · Seller: AGTRENZ Partner Store</p>
                </div>
                <strong className="buyer-status buyer-status--warning">Preparing</strong>
              </div>

              <div className="track-order-timeline">
                {timeline.map((step) => (
                  <article key={step.label} className={step.done ? 'track-step track-step--done' : 'track-step'}>
                    <span className="track-step__dot" />
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="track-order-result__actions">
                <Link to="/orders">View all orders</Link>
                <Link to="/help">Need help?</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
