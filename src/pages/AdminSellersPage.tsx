import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminSellers, type AdminSellerRow } from '../lib/marketplaceBackend'

export function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSellerRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchAdminSellers().then((rows) => {
      setSellers(rows)
      setLoading(false)
    })
  }, [])

  const filtered = sellers.filter((seller) => {
    const matchesQuery = `${seller.business_name} ${seller.iso_alpha2}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || seller.kyc_status === status
    return matchesQuery && matchesStatus
  })

  return (
    <AdminDashboardShell
      title="Sellers"
      subtitle="Manage seller accounts, onboarding status, and marketplace participation."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Seller directory</h2>
            <p>Search, filter, and review seller performance and compliance.</p>
          </div>
          <div className="admin-toolbar-actions">
            <input
              type="search"
              placeholder="Search sellers..."
              aria-label="Search sellers"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select aria-label="Filter seller status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="not_submitted">Not submitted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading sellers...</p>
        ) : filtered.length === 0 ? (
          <PanelEmptyState
            title="No sellers yet"
            message="Seller accounts will appear here after registration and onboarding."
          />
        ) : (
          <div className="admin-table">
            {filtered.map((seller) => (
              <article key={seller.user_id} className="admin-table__row">
                <div>
                  <strong>{seller.business_name}</strong>
                  <p>{seller.iso_alpha2}</p>
                </div>
                <div>
                  <span>{seller.kyc_status}</span>
                  <span>{seller.approved_product_count} approved products</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
