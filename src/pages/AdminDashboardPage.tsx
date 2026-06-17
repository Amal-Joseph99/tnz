import { useState } from 'react'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

export function AdminDashboardPage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)

  const handleKycDecision = (approved: boolean) => {
    const nextWorkflow = updateSellerWorkflow((state) => ({
      ...state,
      kycStatus: approved ? 'approved' : 'rejected',
      warehouseCompleted: approved ? state.warehouseCompleted : false,
      productApprovalStatus: approved ? state.productApprovalStatus : 'none',
    }))
    setWorkflow(nextWorkflow)
  }

  const handleProductDecision = (approved: boolean) => {
    const nextWorkflow = updateSellerWorkflow((state) => ({
      ...state,
      productApprovalStatus: approved ? 'approved' : 'rejected',
    }))
    setWorkflow(nextWorkflow)
  }

  return (
    <section className="seller-dashboard-page admin-dashboard-page">
      <div className="container seller-dashboard">
        <div className="seller-dashboard__header">
          <div>
            <span>Admin Console</span>
            <h1>Admin dashboard</h1>
            <p>Manage marketplace operations, seller approvals, orders, risk, and platform health.</p>
          </div>
        </div>

        <div className="seller-dashboard__stats">
          <article><span>Pending KYC</span><strong>{workflow.kycStatus === 'pending' ? '1' : '0'}</strong><p>Seller verification requests</p></article>
          <article><span>Open disputes</span><strong>5</strong><p>Customer and seller cases</p></article>
          <article><span>Active sellers</span><strong>428</strong><p>Verified marketplace sellers</p></article>
          <article><span>Product approvals</span><strong>{workflow.productApprovalStatus === 'pending' ? '1' : '0'}</strong><p>Listings waiting review</p></article>
        </div>

        <div className="seller-dashboard__grid">
          <section className="seller-dashboard__panel">
            <h2>Seller KYC approval</h2>
            {workflow.kycStatus === 'pending' ? (
              <div className="admin-approval-card">
                <strong>New seller KYC request</strong>
                <p>Seller: AGTRENZ Partner Store</p>
                <p>KYC ID: {workflow.kycId}</p>
                <p>Status: Pending admin review</p>
                <div className="admin-approval-card__actions">
                  <button type="button" className="admin-accept" onClick={() => handleKycDecision(true)}>Accept</button>
                  <button type="button" className="admin-reject" onClick={() => handleKycDecision(false)}>Reject</button>
                </div>
              </div>
            ) : (
              <div className="seller-dashboard__status">
                <strong>KYC status</strong>
                <span>{workflow.kycStatus.replace('_', ' ')}</span>
              </div>
            )}
          </section>

          <section className="seller-dashboard__panel">
            <h2>Product listing approval</h2>
            {workflow.productApprovalStatus === 'pending' ? (
              <div className="admin-approval-card">
                <strong>{workflow.productName}</strong>
                <p>Seller: AGTRENZ Partner Store</p>
                <p>Visibility: Not public until approved</p>
                <div className="admin-approval-card__actions">
                  <button type="button" className="admin-accept" onClick={() => handleProductDecision(true)}>Approve listing</button>
                  <button type="button" className="admin-reject" onClick={() => handleProductDecision(false)}>Reject listing</button>
                </div>
              </div>
            ) : (
              <div className="seller-dashboard__status">
                <strong>Product approval status</strong>
                <span>{workflow.productApprovalStatus}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
