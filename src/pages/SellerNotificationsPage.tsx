import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchNotifications, markAllNotificationsRead } from '../lib/marketplaceBackend'

export function SellerNotificationsPage() {
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
    <SellerDashboardShell>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div><h2>Seller alerts</h2></div>
          <button type="button" className="seller-btn seller-btn--ghost" onClick={() => { void markAllNotificationsRead().then(load) }}>Mark all read</button>
        </div>
        {loading ? <p>Loading...</p> : items.length === 0 ? (
          <PanelEmptyState title="No notifications" message="New order and payout alerts will appear here." />
        ) : (
          <div className="admin-table">
            {items.map((item) => (
              <article key={item.id} className="admin-table__row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  {item.link_path && <Link to={item.link_path}>Open</Link>}
                </div>
                <span>{item.is_read ? 'Read' : 'New'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </SellerDashboardShell>
  )
}
