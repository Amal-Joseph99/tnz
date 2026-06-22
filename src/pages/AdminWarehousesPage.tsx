import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { AdminListPagination, ADMIN_LIST_PAGE_SIZE, paginateItems } from '../components/AdminListPagination'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminWarehouses, type AdminWarehouseRow } from '../lib/adminWarehouses'

export function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<AdminWarehouseRow[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchAdminWarehouses().then((rows) => {
      setWarehouses(rows)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query])

  const filtered = warehouses.filter((row) => {
    const haystack = `${row.businessName} ${row.sellerEmail} ${row.warehouseId} ${row.city}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const pageItems = paginateItems(filtered, page, ADMIN_LIST_PAGE_SIZE)

  return (
    <AdminDashboardShell title="Warehouses" hidePageHeading>
      <section className="admin-panel admin-panel--compact">
        <div className="admin-compact-toolbar">
          <input
            type="search"
            className="admin-compact-toolbar__search"
            placeholder="Search seller or warehouse..."
            aria-label="Search warehouses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="admin-compact-empty">Loading warehouses...</p>
        ) : filtered.length === 0 ? (
          <PanelEmptyState
            title="No warehouse records yet"
            message="Seller warehouse data will appear here after sellers complete Verify & Save."
          />
        ) : (
          <>
            <div className="admin-compact-list admin-compact-list--warehouses">
              <div className="admin-compact-list__head">
                <span>Seller</span>
                <span>Email</span>
                <span />
              </div>
              {pageItems.map((row) => (
                <article key={row.userId} className="admin-compact-list__row">
                  <strong className="admin-compact-list__name">{row.businessName || row.sellerEmail}</strong>
                  <span className="admin-compact-list__email">{row.sellerEmail}</span>
                  <Link
                    to={`/admin/warehouses/${row.userId}`}
                    className="admin-btn admin-btn--sm admin-btn--ghost"
                  >
                    View
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
