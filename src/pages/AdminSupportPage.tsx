import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminSupportRequests, type SupportRequestRow } from '../lib/marketplaceBackend'

export function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequestRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchAdminSupportRequests().then((rows) => {
      setRequests(rows)
      setLoading(false)
    })
  }, [])

  return (
    <AdminDashboardShell title="Support Inbox" subtitle="Contact messages and portal support requests.">
      <section className="admin-panel">
        {loading ? <p>Loading...</p> : requests.length === 0 ? (
          <PanelEmptyState title="No support messages" message="Customer and seller support requests will appear here." />
        ) : (
          <div className="admin-table">
            {requests.map((row) => (
              <article key={`${row.source}-${row.id}`} className="admin-table__row">
                <div>
                  <strong>{row.topic_key}</strong>
                  <p>{row.message}</p>
                  <span>{row.source} · {row.portal_key} · {row.status}</span>
                </div>
                <span>{new Date(row.created_at).toLocaleString()}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
