import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { StatusMessageDialog } from '../components/StatusMessageDialog'
import {
  ADMIN_SHIPPING_PARTNERS,
  fetchAdminWarehouse,
  syncAdminWarehousePickup,
  updateAdminWarehouse,
  type AdminWarehouseRow,
  type AdminWarehouseUpdateInput,
} from '../lib/adminWarehouses'

function formatOperationalDays(days: string[]) {
  if (days.length === 0) return '—'
  return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')
}

function warehouseToForm(row: AdminWarehouseRow): AdminWarehouseUpdateInput {
  return {
    addressLine1: row.addressLine1,
    landmark: row.landmark ?? '',
    postalCode: row.postalCode,
    city: row.city,
    stateName: row.stateName,
    countryName: row.countryName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    supplierName: row.supplierName ?? '',
    supplierGstin: row.supplierGstin ?? '',
  }
}

export function AdminWarehouseDetailPage() {
  const { userId = '' } = useParams()
  const [warehouse, setWarehouse] = useState<AdminWarehouseRow | null>(null)
  const [form, setForm] = useState<AdminWarehouseUpdateInput | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null)
  const [syncMenuOpen, setSyncMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null)
  const syncMenuRef = useRef<HTMLDivElement>(null)

  const loadWarehouse = async () => {
    if (!userId) return
    setLoading(true)
    const row = await fetchAdminWarehouse(userId)
    setWarehouse(row)
    setForm(row ? warehouseToForm(row) : null)
    setLoading(false)
  }

  useEffect(() => {
    void loadWarehouse()
  }, [userId])

  useEffect(() => {
    if (!syncMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!syncMenuRef.current?.contains(event.target as Node)) {
        setSyncMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [syncMenuOpen])

  const handleSave = async () => {
    if (!userId || !form) return
    setSaving(true)
    const result = await updateAdminWarehouse(userId, form)
    setSaving(false)
    if (!result.ok) {
      setDialog({ title: 'Save failed', message: result.message, variant: 'error' })
      return
    }
    setEditing(false)
    setDialog({ title: 'Warehouse updated', message: 'Warehouse details were saved.', variant: 'success' })
    await loadWarehouse()
  }

  const handleSync = async (provider: string) => {
    if (!userId) return
    setSyncMenuOpen(false)
    setSyncingProvider(provider)
    const result = await syncAdminWarehousePickup(userId, provider)
    setSyncingProvider(null)
    if (!result.ok) {
      setDialog({ title: 'Sync failed', message: result.message, variant: 'error' })
      return
    }
    setDialog({
      title: 'Pickup synced',
      message: `Warehouse pickup synced to ${provider} as "${result.pickupLocationName}".`,
      variant: 'success',
    })
    await loadWarehouse()
  }

  if (!userId) {
    return (
      <AdminDashboardShell title="Warehouse" hidePageHeading>
        <p>Warehouse not found.</p>
      </AdminDashboardShell>
    )
  }

  const shiprocketSynced = Boolean(warehouse?.shiprocketPickupSyncedAt)

  return (
    <AdminDashboardShell title="Warehouse" hidePageHeading>
      <div className="admin-page-toolbar admin-page-toolbar--compact">
        <Link to="/admin/warehouses" className="admin-btn admin-btn--sm admin-btn--ghost">
          ← Back to warehouses
        </Link>
      </div>

      {loading ? (
        <p className="admin-compact-empty">Loading warehouse...</p>
      ) : !warehouse || !form ? (
        <p className="admin-compact-empty">Warehouse not found.</p>
      ) : (
        <section className="admin-panel admin-panel--compact admin-warehouse-detail-page">
          <header className="admin-warehouse-detail-page__header">
            <div>
              <h2>{warehouse.businessName || warehouse.sellerEmail}</h2>
              <p>{warehouse.sellerEmail}</p>
              <span className="admin-warehouse-detail-page__id">Warehouse ID: {warehouse.warehouseId}</span>
            </div>
            <div className="admin-warehouse-detail-page__actions">
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--ghost"
                onClick={() => {
                  if (editing) {
                    setForm(warehouseToForm(warehouse))
                  }
                  setEditing((current) => !current)
                }}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>

              {shiprocketSynced ? (
                <span className="admin-sync-badge">Synced</span>
              ) : (
                <div className="admin-sync-menu" ref={syncMenuRef}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={Boolean(syncingProvider)}
                    onClick={() => setSyncMenuOpen((open) => !open)}
                  >
                    {syncingProvider ? 'Syncing...' : 'Sync pickup'}
                  </button>
                  {syncMenuOpen ? (
                    <ul className="admin-sync-menu__list" role="menu">
                      {ADMIN_SHIPPING_PARTNERS.map((partner) => (
                        <li key={partner.id}>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={syncingProvider === partner.id}
                            onClick={() => void handleSync(partner.id)}
                          >
                            {partner.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}

              {editing ? (
                <button type="button" className="admin-btn admin-btn--sm admin-accept" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              ) : null}
            </div>
          </header>

          <div className="admin-warehouse-detail__grid admin-warehouse-detail__grid--compact">
            <div>
              <strong>Address tag</strong>
              {editing ? (
                <span>{warehouse.addressTagLabel || '—'}</span>
              ) : (
                <span>{warehouse.addressTagLabel || '—'}</span>
              )}
            </div>
            <div>
              <strong>Complete address</strong>
              {editing ? (
                <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
              ) : (
                <span>{warehouse.addressLine1}</span>
              )}
            </div>
            <div>
              <strong>Landmark</strong>
              {editing ? (
                <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
              ) : (
                <span>{warehouse.landmark || '—'}</span>
              )}
            </div>
            <div>
              <strong>Pincode</strong>
              {editing ? (
                <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              ) : (
                <span>{warehouse.postalCode}</span>
              )}
            </div>
            <div>
              <strong>City</strong>
              {editing ? (
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              ) : (
                <span>{warehouse.city}</span>
              )}
            </div>
            <div>
              <strong>State</strong>
              {editing ? (
                <input value={form.stateName} onChange={(e) => setForm({ ...form, stateName: e.target.value })} />
              ) : (
                <span>{warehouse.stateName}</span>
              )}
            </div>
            <div>
              <strong>Country</strong>
              {editing ? (
                <input value={form.countryName} onChange={(e) => setForm({ ...form, countryName: e.target.value })} />
              ) : (
                <span>{warehouse.countryName}</span>
              )}
            </div>
            <div>
              <strong>Contact name</strong>
              {editing ? (
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              ) : (
                <span>{warehouse.contactName || '—'}</span>
              )}
            </div>
            <div>
              <strong>Contact email</strong>
              {editing ? (
                <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              ) : (
                <span>{warehouse.contactEmail || '—'}</span>
              )}
            </div>
            <div>
              <strong>Contact mobile</strong>
              {editing ? (
                <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              ) : (
                <span>{warehouse.contactPhone || '—'}</span>
              )}
            </div>
            <div>
              <strong>Contact role</strong>
              <span>{warehouse.contactRoleLabel || '—'}</span>
            </div>
            <div>
              <strong>Operational days</strong>
              <span>{formatOperationalDays(warehouse.operationalDays)}</span>
            </div>
            <div>
              <strong>Opening time</strong>
              {editing ? (
                <input value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} />
              ) : (
                <span>{warehouse.openingTime || '—'}</span>
              )}
            </div>
            <div>
              <strong>Closing time</strong>
              {editing ? (
                <input value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} />
              ) : (
                <span>{warehouse.closingTime || '—'}</span>
              )}
            </div>
            <div>
              <strong>Supplier address</strong>
              <span>{warehouse.isSupplierAddress ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <strong>Supplier name</strong>
              {editing ? (
                <input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
              ) : (
                <span>{warehouse.supplierName || '—'}</span>
              )}
            </div>
            <div>
              <strong>Supplier GSTIN</strong>
              {editing ? (
                <input value={form.supplierGstin} onChange={(e) => setForm({ ...form, supplierGstin: e.target.value })} />
              ) : (
                <span>{warehouse.supplierGstin || '—'}</span>
              )}
            </div>
            <div>
              <strong>Pickup sync</strong>
              <span>
                {shiprocketSynced
                  ? `Shiprocket · ${new Date(warehouse.shiprocketPickupSyncedAt!).toLocaleString('en-IN')}`
                  : 'Not synced'}
              </span>
            </div>
            <div>
              <strong>Last updated</strong>
              <span>{warehouse.updatedAt ? new Date(warehouse.updatedAt).toLocaleString('en-IN') : '—'}</span>
            </div>
          </div>
        </section>
      )}

      <StatusMessageDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        variant={dialog?.variant}
        onClose={() => setDialog(null)}
      />
    </AdminDashboardShell>
  )
}
