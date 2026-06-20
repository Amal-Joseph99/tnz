import { useEffect, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { fetchSellerWarehouse, saveSellerWarehouse } from '../lib/sellerWarehouse'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

export function SellerWarehousePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [warehouseName, setWarehouseName] = useState('Main Fulfillment Center')
  const [addressLine, setAddressLine] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [shiprocketPickupLocationName, setShiprocketPickupLocationName] = useState('')
  const [dispatchCutoffTime, setDispatchCutoffTime] = useState('17:00')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchSellerWorkflow(), fetchSellerWarehouse()])
      .then(([workflowState, warehouse]) => {
        if (!active) return
        setWorkflow(workflowState)
        if (warehouse) {
          setWarehouseName(warehouse.warehouseName)
          setAddressLine(warehouse.addressLine)
          setPostalCode(warehouse.postalCode)
          setShiprocketPickupLocationName(warehouse.shiprocketPickupLocationName)
          setDispatchCutoffTime(warehouse.dispatchCutoffTime)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSaveWarehouse = async () => {
    setError('')
    setMessage('')
    setSaving(true)

    const result = await saveSellerWarehouse({
      warehouseName,
      addressLine,
      postalCode,
      dispatchCutoffTime,
      shiprocketPickupLocationName,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const nextWorkflow = await fetchSellerWorkflow()
    setWorkflow(nextWorkflow)
    setMessage('Warehouse address saved. Product listing is now unlocked, but each product still needs admin approval.')
  }

  if (loading || !workflow) {
    return (
      <SellerDashboardShell title="Warehouse" subtitle="Manage fulfillment locations, stock movement, and dispatch readiness.">
        <p>Loading warehouse...</p>
      </SellerDashboardShell>
    )
  }

  if (workflow.kycStatus !== 'approved') {
    return (
      <SellerDashboardShell title="Warehouse" subtitle="Warehouse setup unlocks after admin KYC approval.">
        <section className="seller-console-card seller-gate-card">
          <h2>Warehouse setup locked</h2>
          <p>Your KYC must be approved by admin before you can add warehouse address and fulfillment settings.</p>
          <div className="seller-status-list">
            <div><strong>KYC ID</strong><span>{workflow.kycId || 'Not submitted'}</span></div>
            <div><strong>KYC status</strong><span>{workflow.kycStatus.replace('_', ' ')}</span></div>
          </div>
        </section>
      </SellerDashboardShell>
    )
  }

  return (
    <SellerDashboardShell title="Warehouse" subtitle="Manage fulfillment locations, stock movement, and dispatch readiness.">
      <section className="seller-console-grid">
        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Warehouse address</h2>
              <p>Required before creating product listings.</p>
            </div>
            <span className="seller-badge seller-badge--success">KYC approved</span>
          </div>
          <form className="seller-console-form seller-console-form--single">
            <label>Warehouse name<input value={warehouseName} onChange={(event) => setWarehouseName(event.target.value)} /></label>
            <label>Address line<textarea value={addressLine} onChange={(event) => setAddressLine(event.target.value)} /></label>
            <label>Postal code<input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} /></label>
            <label>Shiprocket pickup location name<input value={shiprocketPickupLocationName} onChange={(event) => setShiprocketPickupLocationName(event.target.value)} placeholder="Exact pickup name from Shiprocket panel" /></label>
            <label>Dispatch cutoff time<input type="time" value={dispatchCutoffTime} onChange={(event) => setDispatchCutoffTime(event.target.value)} /></label>
          </form>
          {error && <div className="auth-message auth-message--error">{error}</div>}
          {message && <div className="auth-message auth-message--success">{message}</div>}
          <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleSaveWarehouse()}>
            {saving ? 'Saving...' : 'Save warehouse address'}
          </button>
        </article>
        <article className="seller-console-card">
          <h2>Warehouse status</h2>
          <div className="seller-status-list">
            <div><strong>Warehouse setup</strong><span>{workflow.warehouseCompleted ? 'Completed' : 'Pending'}</span></div>
            <div><strong>Product listing</strong><span>{workflow.warehouseCompleted ? 'Unlocked' : 'Locked'}</span></div>
            <div><strong>Admin product approval</strong><span>Required</span></div>
          </div>
        </article>
      </section>
    </SellerDashboardShell>
  )
}
