import { useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

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
        <PanelEmptyState
          title="No product submissions"
          message="Seller listings awaiting review will appear in this queue."
        />
      </section>
    </AdminDashboardShell>
  )
}
