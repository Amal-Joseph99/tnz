import { useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

const productQueue = [
  { id: 'PRD-5521', name: 'Stainless steel kitchen organizer', seller: 'UrbanCraft India', category: 'Home', submitted: 'Jun 17', status: 'Pending' },
  { id: 'PRD-5518', name: 'Cotton crew neck t-shirt pack', seller: 'AGTRENZ Partner Store', category: 'Fashion', submitted: 'Jun 16', status: 'Pending' },
]

export function AdminProductsPage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)

  const handleDecision = (approved: boolean) => {
    setWorkflow(updateSellerWorkflow((state) => ({
      ...state,
      productApprovalStatus: approved ? 'approved' : 'rejected',
    })))
  }

  return (
    <AdminDashboardShell
      title="Products"
      subtitle="Review product listings, compliance, and marketplace visibility."
    >
      {workflow.productApprovalStatus === 'pending' && (
        <section className="admin-panel admin-panel--highlight">
          <div className="admin-panel__header">
            <h2>Priority listing review</h2>
            <p>Active submission from seller product workflow.</p>
          </div>
          <div className="admin-approval-card">
            <strong>{workflow.productName}</strong>
            <p>Seller: AGTRENZ Partner Store</p>
            <p>Status: Awaiting admin approval before public listing</p>
            <div className="admin-approval-card__actions">
              <button type="button" className="admin-accept" onClick={() => handleDecision(true)}>Approve listing</button>
              <button type="button" className="admin-reject" onClick={() => handleDecision(false)}>Reject listing</button>
            </div>
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Product approval queue</h2>
            <p>Listings submitted by sellers for marketplace publication.</p>
          </div>
          <input type="search" placeholder="Search products..." aria-label="Search products" />
        </div>
        <div className="admin-table">
          <div className="admin-table__row admin-table__row--head">
            <span>Product ID</span><span>Listing</span><span>Seller</span><span>Category</span><span>Submitted</span><span>Status</span>
          </div>
          {productQueue.map((item) => (
            <div key={item.id} className="admin-table__row">
              <span>{item.id}</span>
              <span>{item.name}</span>
              <span>{item.seller}</span>
              <span>{item.category}</span>
              <span>{item.submitted}</span>
              <strong>{item.status}</strong>
            </div>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
