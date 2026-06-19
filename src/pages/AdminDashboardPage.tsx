import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

export function AdminDashboardPage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)

  const pendingKyc = workflow.kycStatus === 'pending' ? 1 : 0
  const pendingProducts = workflow.productApprovalStatus === 'pending' ? 1 : 0

  const handleKycDecision = (approved: boolean) => {
    setWorkflow(updateSellerWorkflow((state) => ({
      ...state,
      kycStatus: approved ? 'approved' : 'rejected',
      warehouseCompleted: approved ? state.warehouseCompleted : false,
      productApprovalStatus: approved ? state.productApprovalStatus : 'none',
    })))
  }

  const handleProductDecision = (approved: boolean) => {
    setWorkflow(updateSellerWorkflow((state) => ({
      ...state,
      productApprovalStatus: approved ? 'approved' : 'rejected',
    })))
  }

  return (
    <AdminDashboardShell
      title="Dashboard"
      subtitle="Monitor marketplace health, approvals, disputes, and operational KPIs."
    >
      <section className="admin-kpi-grid">
        <article>
          <span>GMV today</span>
          <strong>$0</strong>
          <p>No marketplace volume yet</p>
        </article>
        <article>
          <span>Orders today</span>
          <strong>0</strong>
          <p>No orders recorded</p>
        </article>
        <article>
          <span>Pending KYC</span>
          <strong>{pendingKyc}</strong>
          <p>Seller verification queue</p>
        </article>
        <article>
          <span>Listing reviews</span>
          <strong>{pendingProducts}</strong>
          <p>Awaiting publication approval</p>
        </article>
      </section>

      <section className="admin-console-grid">
        <article className="admin-console-card admin-console-card--wide">
          <div className="admin-console-card__header">
            <div>
              <h2>Marketplace volume</h2>
              <p>Order value trend for the current week</p>
            </div>
            <Link to="/admin/orders" className="admin-btn admin-btn--ghost">View orders</Link>
          </div>
          <PanelEmptyState
            title="No marketplace volume yet"
            message="Volume charts will appear after the first orders are placed."
          />
        </article>

        <article className="admin-console-card">
          <div className="admin-console-card__header">
            <div>
              <h2>Platform health</h2>
              <p>Operational status overview</p>
            </div>
          </div>
          <div className="admin-status-list">
            <div><strong>Payment gateway</strong><span className="admin-status-pill admin-status-pill--ok">Operational</span></div>
            <div><strong>Seller onboarding</strong><span className="admin-status-pill admin-status-pill--warn">{pendingKyc} pending</span></div>
            <div><strong>Dispute queue</strong><span className="admin-status-pill admin-status-pill--ok">0 open</span></div>
            <div><strong>Payout processing</strong><span className="admin-status-pill admin-status-pill--ok">On schedule</span></div>
          </div>
        </article>

        <article className="admin-console-card">
          <div className="admin-console-card__header">
            <div>
              <h2>Priority actions</h2>
              <p>Tasks requiring admin attention</p>
            </div>
          </div>
          <div className="admin-action-list">
            <Link to="/admin/kyc">Review {pendingKyc} KYC submission{pendingKyc !== 1 ? 's' : ''}</Link>
            <Link to="/admin/products">Approve {pendingProducts} product listing{pendingProducts !== 1 ? 's' : ''}</Link>
            <Link to="/admin/orders">View order operations</Link>
            <Link to="/admin/sellers">View seller directory</Link>
          </div>
        </article>
      </section>

      <div className="admin-panel-grid">
        <section className="admin-panel">
          <div className="admin-panel__header admin-panel__header--toolbar">
            <div>
              <h2>Seller KYC approval</h2>
              <p>Identity and business verification queue.</p>
            </div>
            <Link to="/admin/kyc" className="admin-btn admin-btn--ghost">Open KYC queue</Link>
          </div>
          {workflow.kycStatus === 'pending' ? (
            <div className="admin-approval-card">
              <strong>{workflow.productName || 'Seller submission'}</strong>
              <p>KYC ID: {workflow.kycId}</p>
              <p>Documents: PAN, GST, bank proof, address proof</p>
              <p>Status: Pending review</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => handleKycDecision(true)}>Approve KYC</button>
                <button type="button" className="admin-reject" onClick={() => handleKycDecision(false)}>Reject KYC</button>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No pending KYC in active workflow</strong>
              <p>Current status: {workflow.kycStatus.replace('_', ' ')}</p>
              <Link to="/admin/kyc">View all KYC requests</Link>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header admin-panel__header--toolbar">
            <div>
              <h2>Product listing approval</h2>
              <p>Listings blocked until admin publishes them.</p>
            </div>
            <Link to="/admin/products" className="admin-btn admin-btn--ghost">Open product queue</Link>
          </div>
          {workflow.productApprovalStatus === 'pending' ? (
            <div className="admin-approval-card">
              <strong>{workflow.productName}</strong>
              <p>Category: Marketplace listing</p>
              <p>Visibility: Hidden until approved</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => handleProductDecision(true)}>Approve listing</button>
                <button type="button" className="admin-reject" onClick={() => handleProductDecision(false)}>Reject listing</button>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No pending listing in active workflow</strong>
              <p>Current status: {workflow.productApprovalStatus}</p>
              <Link to="/admin/products">View all product submissions</Link>
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Recent orders</h2>
            <p>Latest marketplace orders across all sellers.</p>
          </div>
          <Link to="/admin/orders" className="admin-btn admin-btn--ghost">Manage orders</Link>
        </div>
        <PanelEmptyState
          title="No orders yet"
          message="Marketplace orders will appear here once buyers start purchasing."
        />
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Recent platform activity</h2>
            <p>Audit trail of seller, order, and compliance events.</p>
          </div>
        </div>
        <PanelEmptyState
          title="No platform activity yet"
          message="Audit events will be recorded here as sellers and orders go live."
        />
      </section>
    </AdminDashboardShell>
  )
}
