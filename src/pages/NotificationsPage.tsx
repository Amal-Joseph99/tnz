import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchNotifications, markAllNotificationsRead } from '../lib/marketplaceBackend'

export function NotificationsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchNotifications>>>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    void fetchNotifications().then((rows) => {
      setItems(rows)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <BuyerAccountShell title="Notifications" subtitle="Order updates, payments, and account alerts.">
      <section className="buyer-panel">
        <div className="buyer-panel__header">
          <h2>Your alerts</h2>
          <button type="button" className="buyer-account__action" onClick={() => { void markAllNotificationsRead().then(load) }}>
            Mark all read
          </button>
        </div>
        {loading ? <p>Loading...</p> : items.length === 0 ? (
          <PanelEmptyState title="No notifications" message="Order and account alerts will appear here." />
        ) : (
          <div className="admin-table">
            {items.map((item) => (
              <article key={item.id} className="admin-table__row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  {item.link_path && <Link to={item.link_path}>View</Link>}
                </div>
                <span>{item.is_read ? 'Read' : 'New'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </BuyerAccountShell>
  )
}
