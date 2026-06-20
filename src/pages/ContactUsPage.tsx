import { useState, type FormEvent } from 'react'
import { submitContactMessage } from '../lib/marketplaceBackend'

const TOPIC_MAP: Record<string, string> = {
  orders: 'buyer_order',
  returns: 'buyer_order',
  account: 'buyer_payment',
  seller: 'seller_kyc',
}

export function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('orders')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await submitContactMessage({
      fullName,
      email,
      topicKey: TOPIC_MAP[topic] ?? 'buyer_order',
      message,
    })

    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setSubmitted(true)
  }

  return (
    <section className="contact-page">
      <div className="container contact-page__inner">
        <header className="contact-page__header">
          <span>Support</span>
          <h1>Contact us</h1>
          <p>Reach AGTRENZ support for orders, returns, account issues, and seller inquiries.</p>
        </header>

        <div className="contact-layout">
          <section className="contact-form-panel">
            <h2>Send a message</h2>
            {error && <div className="auth-message auth-message--error">{error}</div>}
            {submitted ? (
              <div className="contact-success">
                <strong>Message received</strong>
                <p>Our support team will respond within one business day.</p>
              </div>
            ) : (
              <form onSubmit={(event) => void handleSubmit(event)}>
                <label>
                  Full name
                  <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" required />
                </label>
                <label>
                  Email address
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                </label>
                <label>
                  Topic
                  <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                    <option value="orders">Orders and delivery</option>
                    <option value="returns">Returns and refunds</option>
                    <option value="account">Account and security</option>
                    <option value="seller">Seller support</option>
                  </select>
                </label>
                <label>
                  Message
                  <textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe your issue or question" required />
                </label>
                <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send message'}</button>
              </form>
            )}
          </section>

          <aside className="contact-info-panel">
            <article>
              <h3>Customer support</h3>
              <p>support@agtrenz.com</p>
              <p>Mon–Sat, 9:00 AM – 7:00 PM IST</p>
            </article>
            <article>
              <h3>Seller operations</h3>
              <p>sellers@agtrenz.com</p>
              <p>KYC, listings, payouts, and warehouse support</p>
            </article>
            <article>
              <h3>Registered office</h3>
              <p>AGTRENZ Marketplace Pvt. Ltd.</p>
              <p>Kannur, Kerala, India</p>
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}
