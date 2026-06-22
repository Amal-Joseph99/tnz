import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { AdminListPagination, ADMIN_LIST_PAGE_SIZE, paginateItems } from '../components/AdminListPagination'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminSellers, type AdminSellerRow } from '../lib/marketplaceBackend'

function formatKycStatus(status: string) {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'pending') return 'Pending'
  if (status === 'not_submitted') return 'Not submitted'
  return status.replaceAll('_', ' ')
}

export function AdminSellersPage() {
  const [sellers, setSellers] = useState<AdminSellerRow[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchAdminSellers().then((rows) => {
      setSellers(rows)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query, status])

  const filtered = sellers.filter((seller) => {
    const matchesQuery = `${seller.business_name} ${seller.iso_alpha2}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = status === 'all' || seller.kyc_status === status
    return matchesQuery && matchesStatus
  })

  const pageItems = paginateItems(filtered, page, ADMIN_LIST_PAGE_SIZE)

  return (
    <AdminDashboardShell title="Sellers" hidePageHeading>
      <section className="admin-panel admin-panel--compact">
        <div className="admin-compact-toolbar">
          <input
            type="search"
            className="admin-compact-toolbar__search"
            placeholder="Search sellers..."
            aria-label="Search sellers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="admin-compact-toolbar__select"
            aria-label="Filter seller status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not submitted</option>
          </select>
        </div>

        {loading ? (
          <p className="admin-compact-empty">Loading sellers...</p>
        ) : filtered.length === 0 ? (
          <PanelEmptyState
            title="No sellers yet"
            message="Seller accounts will appear here after registration and onboarding."
          />
        ) : (
          <>
            <div className="admin-compact-list">
              <div className="admin-compact-list__head">
                <span>Seller</span>
                <span>Country</span>
                <span>KYC</span>
                <span>Products</span>
                <span />
              </div>
              {pageItems.map((seller) => (
                <article key={seller.user_id} className="admin-compact-list__row">
                  <strong className="admin-compact-list__name">{seller.business_name || '—'}</strong>
                  <span>{seller.iso_alpha2}</span>
                  <span className={`admin-status-badge admin-status-badge--${seller.kyc_status}`}>
                    {formatKycStatus(seller.kyc_status)}
                  </span>
                  <span>{seller.approved_product_count}</span>
                  <Link
                    to={`/admin/kyc?seller=${seller.user_id}`}
                    className="admin-btn admin-btn--sm admin-btn--ghost"
                  >
                    Manage
                  </Link>
                </article>
              ))}
            </div>
            <AdminListPagination
              page={page}
              totalItems={filtered.length}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </AdminDashboardShell>
  )
}
