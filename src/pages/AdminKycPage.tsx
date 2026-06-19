import { useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

const kycQueue = [
  { id: 'KYC-882104', seller: 'Northline Essentials', submitted: 'Jun 18, 2026', docs: 'PAN, GST, Bank', status: 'Pending' },
  { id: 'KYC-881902', seller: 'CraftHub Kerala', submitted: 'Jun 17, 2026', docs: 'PAN, GST, Bank', status: 'Under review' },
]

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
            <strong>AGTRENZ Partner Store</strong>
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
        <div className="admin-table">
          <div className="admin-table__row admin-table__row--head">
            <span>KYC ID</span><span>Seller</span><span>Submitted</span><span>Documents</span><span>Status</span><span>Actions</span>
          </div>
          {kycQueue.map((item) => (
            <div key={item.id} className="admin-table__row">
              <span>{item.id}</span>
              <span>{item.seller}</span>
              <span>{item.submitted}</span>
              <span>{item.docs}</span>
              <strong>{item.status}</strong>
              <span className="admin-table__actions">
                <button type="button">Review</button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
