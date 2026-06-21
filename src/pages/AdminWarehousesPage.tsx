import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchAdminWarehouses, type AdminWarehouseRow } from '../lib/adminWarehouses'

function formatOperationalDays(days: string[]) {
  if (days.length === 0) return '—'
  return days
    .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(', ')
}

export function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<AdminWarehouseRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    void fetchAdminWarehouses().then((rows) => {
      setWarehouses(rows)
      setLoading(false)
    })
  }, [])

  const filtered = warehouses.filter((row) => {
    const haystack = `${row.businessName} ${row.sellerEmail} ${row.warehouseId} ${row.city} ${row.stateName}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const selected = filtered.find((row) => row.userId === selectedUserId) ?? filtered[0] ?? null

  useEffect(() => {
    if (filtered[0] && !selectedUserId) {
      setSelectedUserId(filtered[0].userId)
    }
  }, [filtered, selectedUserId])

  return (
    <AdminDashboardShell
      title="Warehouses"
      subtitle="Review seller warehouse addresses, contacts, and operational details."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Seller warehouses</h2>
            <p>All sellers with saved warehouse data.</p>
          </div>
          <input
            type="search"
            placeholder="Search seller, warehouse ID, city..."
            aria-label="Search warehouses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading warehouses...</p>
        ) : filtered.length === 0 ? (
          <PanelEmptyState
            title="No warehouse records yet"
            message="Seller warehouse data will appear here after sellers complete Verify & Save."
          />
        ) : (
          <div className="admin-warehouse-layout">
            <div className="admin-table admin-table--categories">
              <div className="admin-table__row admin-table__row--head">
                <span>Seller</span>
                <span>Warehouse ID</span>
                <span>City</span>
                <span>Status</span>
              </div>
              {filtered.map((row) => (
                <button
                  type="button"
                  key={row.userId}
                  className={`admin-table__row admin-warehouse-row${selected?.userId === row.userId ? ' admin-warehouse-row--active' : ''}`}
                  onClick={() => setSelectedUserId(row.userId)}
                >
                  <span>
                    <strong>{row.businessName || row.sellerEmail}</strong>
                    <small>{row.sellerEmail}</small>
                  </span>
                  <span>{row.warehouseId}</span>
                  <span>{row.city}</span>
                  <span>{row.isCompleted ? 'Completed' : 'Pending'}</span>
                </button>
              ))}
            </div>

            {selected ? (
              <article className="admin-warehouse-detail">
                <header className="admin-warehouse-detail__header">
                  <div>
                    <h3>{selected.businessName || selected.sellerEmail}</h3>
                    <p>{selected.sellerEmail}</p>
                  </div>
                  <span className="seller-badge">Warehouse ID: {selected.warehouseId}</span>
                </header>

                <div className="admin-warehouse-detail__grid">
                  <div><strong>Address tag</strong><span>{selected.addressTagLabel || '—'}</span></div>
                  <div><strong>Complete address</strong><span>{selected.addressLine1}</span></div>
                  <div><strong>Landmark</strong><span>{selected.landmark || '—'}</span></div>
                  <div><strong>Pincode</strong><span>{selected.postalCode}</span></div>
                  <div><strong>City</strong><span>{selected.city}</span></div>
                  <div><strong>State</strong><span>{selected.stateName}</span></div>
                  <div><strong>Country</strong><span>{selected.countryName}</span></div>
                  <div><strong>Location</strong><span>{selected.locationLabel || '—'}</span></div>
                  <div><strong>Latitude</strong><span>{selected.latitude ?? '—'}</span></div>
                  <div><strong>Longitude</strong><span>{selected.longitude ?? '—'}</span></div>
                  <div><strong>Contact name</strong><span>{selected.contactName || '—'}</span></div>
                  <div><strong>Contact email</strong><span>{selected.contactEmail || '—'}</span></div>
                  <div><strong>Contact mobile</strong><span>{selected.contactPhone || '—'}</span></div>
                  <div><strong>Contact role</strong><span>{selected.contactRoleLabel || '—'}</span></div>
                  <div><strong>Operational days</strong><span>{formatOperationalDays(selected.operationalDays)}</span></div>
                  <div><strong>Opening time</strong><span>{selected.openingTime || '—'}</span></div>
                  <div><strong>Closing time</strong><span>{selected.closingTime || '—'}</span></div>
                  <div><strong>Supplier address</strong><span>{selected.isSupplierAddress ? 'Yes' : 'No'}</span></div>
                  <div><strong>Supplier name</strong><span>{selected.supplierName || '—'}</span></div>
                  <div><strong>Supplier GSTIN</strong><span>{selected.supplierGstin || '—'}</span></div>
                  <div><strong>Last updated</strong><span>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'}</span></div>
                </div>
              </article>
            ) : null}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
