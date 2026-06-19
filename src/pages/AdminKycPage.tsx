import { useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

export function AdminKycPage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)

  const handleDecision = (approved: boolean) => {
    setWorkflow(updateSellerWorkflow((state) => ({
      ...state,
      kycStatus: approved ? 'approved' : 'rejected',
      warehouseCompleted: approved ? state.warehouseCompleted : false,
    })))
  }

  return (
    <AdminDashboardShell
      title="KYC Approvals"
      subtitle="Review seller identity, business documents, and bank verification."
    >
      {workflow.kycStatus === 'pending' && (
        <section className="admin-panel admin-panel--highlight">
          <div className="admin-panel__header">
            <h2>Priority review</h2>
            <p>Active submission from logged seller workflow.</p>
          </div>
          <div className="admin-approval-card">
            <strong>Seller submission</strong>
            <p>KYC ID: {workflow.kycId}</p>
            <p>Documents: PAN, GST certificate, cancelled cheque, address proof</p>
            <div className="admin-approval-card__actions">
              <button type="button" className="admin-accept" onClick={() => handleDecision(true)}>Approve KYC</button>
              <button type="button" className="admin-reject" onClick={() => handleDecision(false)}>Reject KYC</button>
            </div>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>KYC queue</h2>
            <p>All pending and in-review seller verification requests.</p>
          </div>
          <select aria-label="Filter KYC status">
            <option>Pending review</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
        <PanelEmptyState
          title="No KYC submissions in queue"
          message="Seller verification requests will appear here for review."
        />
      </section>
    </AdminDashboardShell>
  )
}
