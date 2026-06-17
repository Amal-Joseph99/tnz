import { useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

export function SellerWarehousePage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)
  const [message, setMessage] = useState('')

  const handleSaveWarehouse = () => {
    const nextWorkflow = updateSellerWorkflow((state) => ({
      ...state,
      warehouseCompleted: true,
    }))
    setWorkflow(nextWorkflow)
    setMessage('Warehouse address saved. Product listing is now unlocked, but each product still needs admin approval.')
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
            <label>Warehouse name<input defaultValue="Main Fulfillment Center" /></label>
            <label>Address line<textarea defaultValue="Taliparamba, Kannur, Kerala, India" /></label>
            <label>Postal code<input defaultValue="670141" /></label>
            <label>Dispatch cutoff time<input type="time" defaultValue="17:00" /></label>
          </form>
          {message && <div className="auth-message auth-message--success">{message}</div>}
          <button type="button" className="seller-primary-action" onClick={handleSaveWarehouse}>
            Save warehouse address
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
