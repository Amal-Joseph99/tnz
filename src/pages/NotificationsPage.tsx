import { PageShell } from '../components/PageShell'

export function NotificationsPage() {
  return (
    <PageShell
      eyebrow="Account"
      title="Notifications"
      subtitle="Stay updated on orders, offers, seller messages, and account alerts."
    >
      <div className="account-workspace">
        <section className="account-main-panel">
          <div className="account-tabs" aria-label="Notification filters">
            <button type="button" className="account-tabs__item account-tabs__item--active">All</button>
            <button type="button" className="account-tabs__item">Orders</button>
            <button type="button" className="account-tabs__item">Offers</button>
            <button type="button" className="account-tabs__item">Account</button>
          </div>

          <div className="notification-list">
            <article className="notification-item notification-item--unread">
              <span className="notification-item__dot" />
              <div>
                <h2>Your recent order is being prepared</h2>
                <p>We will notify you when the seller dispatches your package.</p>
                <time>Today, 9:15 AM</time>
              </div>
            </article>
            <article className="notification-item">
              <span className="notification-item__dot" />
              <div>
                <h2>Price drop on saved products</h2>
                <p>Some products in your saved list now have better marketplace pricing.</p>
                <time>Yesterday</time>
              </div>
            </article>
            <article className="notification-item">
              <span className="notification-item__dot" />
              <div>
                <h2>Account security reminder</h2>
                <p>Keep your password updated and verify your recovery email.</p>
                <time>Jun 15</time>
              </div>
            </article>
          </div>
        </section>

        <aside className="account-side-panel">
          <h2>Notification preferences</h2>
          <label><input type="checkbox" defaultChecked /> Order updates</label>
          <label><input type="checkbox" defaultChecked /> Offers and deals</label>
          <label><input type="checkbox" defaultChecked /> Account security</label>
          <button type="button">Update preferences</button>
        </aside>
      </div>
    </PageShell>
  )
}
