import { BuyerAccountShell } from '../components/BuyerAccountShell'

const notifications = [
  {
    id: '1',
    title: 'Your recent order is being prepared',
    body: 'We will notify you when the seller dispatches your package.',
    time: 'Today, 9:15 AM',
    unread: true,
    category: 'Orders',
  },
  {
    id: '2',
    title: 'Price drop on saved products',
    body: 'Some products in your saved list now have better marketplace pricing.',
    time: 'Yesterday',
    unread: false,
    category: 'Offers',
  },
  {
    id: '3',
    title: 'Account security reminder',
    body: 'Keep your password updated and verify your recovery email.',
    time: 'Jun 15',
    unread: false,
    category: 'Account',
  },
  {
    id: '4',
    title: 'Order #AGT-10188 shipped',
    body: 'Your package left the seller warehouse and is on the way.',
    time: 'Jun 18',
    unread: true,
    category: 'Orders',
  },
]

export function NotificationsPage() {
  return (
    <BuyerAccountShell
      title="Notifications"
      subtitle="Stay updated on orders, offers, seller messages, and account alerts."
      action={<button type="button" className="buyer-account__action buyer-account__action--ghost">Mark all read</button>}
    >
      <div className="buyer-workspace">
        <section className="buyer-panel">
          <div className="buyer-tabs" role="tablist" aria-label="Notification filters">
            <button type="button" className="buyer-tabs__item buyer-tabs__item--active">All</button>
            <button type="button" className="buyer-tabs__item">Orders</button>
            <button type="button" className="buyer-tabs__item">Offers</button>
            <button type="button" className="buyer-tabs__item">Account</button>
          </div>

          <div className="buyer-notification-list">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={item.unread ? 'buyer-notification buyer-notification--unread' : 'buyer-notification'}
              >
                <span className="buyer-notification__dot" />
                <div>
                  <div className="buyer-notification__meta">
                    <h2>{item.title}</h2>
                    <span>{item.category}</span>
                  </div>
                  <p>{item.body}</p>
                  <time>{item.time}</time>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="buyer-side-panel">
          <h2>Notification preferences</h2>
          <label><input type="checkbox" defaultChecked /> Order updates</label>
          <label><input type="checkbox" defaultChecked /> Offers and deals</label>
          <label><input type="checkbox" defaultChecked /> Account security</label>
          <label><input type="checkbox" /> Marketing emails</label>
          <button type="button" className="buyer-account__action">Update preferences</button>
        </aside>
      </div>
    </BuyerAccountShell>
  )
}
