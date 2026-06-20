import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminBuyers, type AdminBuyerRow } from '../lib/marketplaceBackend'

export function AdminCustomersPage() {
  const [buyers, setBuyers] = useState<AdminBuyerRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchAdminBuyers().then((rows) => {
      setBuyers(rows)
      setLoading(false)
    })
  }, [])

  const filtered = buyers.filter((buyer) => {
    const haystack = `${buyer.full_name} ${buyer.phone ?? ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  return (
    <AdminDashboardShell
      title="Customers"
      subtitle="View buyer accounts, order history, and risk flags."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Customer directory</h2>
            <p>Search buyers and review account activity.</p>
          </div>
          <input
            type="search"
            placeholder="Search customers..."
            aria-label="Search customers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading customers...</p>
        ) : filtered.length === 0 ? (
          <PanelEmptyState
            title="No customers yet"
            message="Registered buyer accounts will appear in this directory."
          />
        ) : (
          <div className="admin-table">
            {filtered.map((buyer) => (
              <article key={buyer.user_id} className="admin-table__row">
                <div>
                  <strong>{buyer.full_name}</strong>
                  <p>{buyer.phone ?? 'No phone'}</p>
                </div>
                <div>
                  <span>{buyer.order_count} orders</span>
                  <span>{new Date(buyer.created_at).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
