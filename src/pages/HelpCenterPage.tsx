import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

export function HelpCenterPage() {
  return (
    <PageShell
      eyebrow="Support"
      title="Help Center"
      subtitle="Find answers about shopping, payments, orders, returns, and seller support."
    >
      <section className="support-layout">
        <div className="support-search-panel">
          <h2>How can we help?</h2>
          <form onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Search orders, refunds, payments, account help..." />
            <button type="submit">Search</button>
          </form>
        </div>

        <div className="support-grid">
          <Link to="/orders" className="support-card">
            <span>01</span>
            <h3>Orders and delivery</h3>
            <p>Track shipments, cancel eligible orders, and download invoices.</p>
          </Link>
          <Link to="/returns" className="support-card">
            <span>02</span>
            <h3>Returns and refunds</h3>
            <p>Start returns, check eligibility, and review refund timelines.</p>
          </Link>
          <Link to="/profile" className="support-card">
            <span>03</span>
            <h3>Account settings</h3>
            <p>Update login details, addresses, notifications, and security.</p>
          </Link>
          <Link to="/seller/signin" className="support-card">
            <span>04</span>
            <h3>Seller support</h3>
            <p>Get help with listings, seller login, payouts, and operations.</p>
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
