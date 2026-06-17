import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

export function OrdersPage() {
  return (
    <PageShell
      eyebrow="Account"
      title="My orders"
      subtitle="View current orders, delivery updates, invoices, and return actions."
    >
      <section className="orders-panel">
        <div className="orders-toolbar">
          <div>
            <h2>Recent orders</h2>
            <p>Track purchases, invoices, delivery progress, and returns.</p>
          </div>
          <select aria-label="Filter orders">
            <option>Last 30 days</option>
            <option>Last 6 months</option>
            <option>All orders</option>
          </select>
        </div>

        <div className="order-list">
          <article className="order-row">
            <div>
              <span className="order-row__label">Order #AGT-10291</span>
              <h3>Wireless headphones and travel pouch</h3>
              <p>Placed Jun 14 · 2 items · Paid online</p>
            </div>
            <div className="order-row__status">
              <strong>Preparing</strong>
              <span>Estimated delivery Jun 20</span>
            </div>
            <Link to="/track-order">Track</Link>
          </article>

          <article className="order-row">
            <div>
              <span className="order-row__label">Order #AGT-10244</span>
              <h3>Home organizer set</h3>
              <p>Placed Jun 02 · 1 item · Invoice available</p>
            </div>
            <div className="order-row__status order-row__status--delivered">
              <strong>Delivered</strong>
              <span>Delivered Jun 07</span>
            </div>
            <Link to="/returns">Return</Link>
          </article>
        </div>
      </section>
    </PageShell>
  )
}
