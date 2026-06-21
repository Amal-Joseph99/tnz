import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchNotifications, markAllNotificationsRead } from '../lib/marketplaceBackend'

export function AdminNotificationsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchNotifications>>>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    void fetchNotifications().then((rows) => {
      setItems(rows)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  return (
    <AdminDashboardShell title="Notifications" subtitle="Platform alerts for approvals, disputes, payouts, and compliance.">
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Admin alerts</h2>
            <p>Operational notifications requiring attention.</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => { void markAllNotificationsRead().then(load) }}>Mark all read</button>
        </div>
        {loading ? <p>Loading...</p> : items.length === 0 ? (
          <PanelEmptyState title="No admin alerts" message="KYC, payout, and compliance alerts will appear here." />
        ) : (
          <div className="admin-table">
            {items.map((item) => (
              <article key={item.id} className="admin-table__row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <span>{item.is_read ? 'Read' : 'New'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
