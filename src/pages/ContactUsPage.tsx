import { useState } from 'react'

export function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false)

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
            {submitted ? (
              <div className="contact-success">
                <strong>Message received</strong>
                <p>Our support team will respond within one business day.</p>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(true)
                }}
              >
                <label>
                  Full name
                  <input type="text" placeholder="Your name" required />
                </label>
                <label>
                  Email address
                  <input type="email" placeholder="you@example.com" required />
                </label>
                <label>
                  Topic
                  <select defaultValue="orders">
                    <option value="orders">Orders and delivery</option>
                    <option value="returns">Returns and refunds</option>
                    <option value="account">Account and security</option>
                    <option value="seller">Seller support</option>
                  </select>
                </label>
                <label>
                  Message
                  <textarea rows={5} placeholder="Describe your issue or question" required />
                </label>
                <button type="submit">Send message</button>
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
