import { AdminDashboardShell } from '../components/AdminDashboardShell'

const alerts = [
  { id: '1', title: 'KYC submission pending review', detail: 'Northline Essentials submitted documents.', time: 'Today, 9:12 AM', type: 'KYC' },
  { id: '2', title: 'Order dispute escalated', detail: 'Order #AGT-20412 requires admin action.', time: 'Today, 8:40 AM', type: 'Dispute' },
  { id: '3', title: 'Product listing submitted', detail: 'UrbanCraft India submitted a new listing.', time: 'Yesterday', type: 'Product' },
  { id: '4', title: 'Seller payout failed', detail: 'GreenLeaf Organics bank verification mismatch.', time: 'Jun 16', type: 'Payout' },
]

export function AdminNotificationsPage() {
  return (
    <AdminDashboardShell
      title="Notifications"
      subtitle="Platform alerts for approvals, disputes, payouts, and compliance."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Admin alerts</h2>
            <p>Operational notifications requiring attention.</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost">Mark all read</button>
        </div>
        <div className="admin-notification-list">
          {alerts.map((alert) => (
            <article key={alert.id} className="admin-notification">
              <div>
                <div className="admin-notification__meta">
                  <h2>{alert.title}</h2>
                  <span>{alert.type}</span>
                </div>
                <p>{alert.detail}</p>
                <time>{alert.time}</time>
              </div>
              <button type="button">Open</button>
            </article>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
