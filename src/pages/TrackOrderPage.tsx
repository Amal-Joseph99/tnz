import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PanelEmptyState } from '../components/PanelEmptyState'

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
                  placeholder="Enter your order ID"
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
              <PanelEmptyState
                title="Order not found"
                message="We could not find an order matching that ID and email. Check your details or view your orders after signing in."
              />
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
