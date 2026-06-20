import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import {
  fetchKycQueue,
  fetchPendingApprovalCounts,
  fetchProductQueue,
  reviewSellerKyc,
  reviewSellerProduct,
} from '../lib/adminApprovals'

export function AdminDashboardPage() {
  const [pendingKyc, setPendingKyc] = useState(0)
  const [pendingProducts, setPendingProducts] = useState(0)
  const [priorityKyc, setPriorityKyc] = useState<Awaited<ReturnType<typeof fetchKycQueue>>[number] | null>(null)
  const [priorityProduct, setPriorityProduct] = useState<Awaited<ReturnType<typeof fetchProductQueue>>[number] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    const [counts, kycQueue, productQueue] = await Promise.all([
      fetchPendingApprovalCounts(),
      fetchKycQueue('pending'),
      fetchProductQueue('pending'),
    ])

    setPendingKyc(counts.pendingKyc)
    setPendingProducts(counts.pendingProducts)
    setPriorityKyc(kycQueue[0] ?? null)
    setPriorityProduct(productQueue[0] ?? null)
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const handleKycDecision = async (approved: boolean) => {
    if (!priorityKyc) return
    setError('')
    setMessage('')

    const result = await reviewSellerKyc(
      priorityKyc.userId,
      approved,
      approved ? undefined : 'Documents or bank details did not pass verification.',
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'KYC approved.' : 'KYC rejected.')
    await loadDashboard()
  }

  const handleProductDecision = async (approved: boolean) => {
    if (!priorityProduct) return
    setError('')
    setMessage('')

    const result = await reviewSellerProduct(
      priorityProduct.id,
      approved,
      approved ? undefined : 'Listing did not meet marketplace compliance requirements.',
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'Product listing approved.' : 'Product listing rejected.')
    await loadDashboard()
  }

  return (
    <AdminDashboardShell
      title="Dashboard"
      subtitle="Monitor marketplace health, approvals, disputes, and operational KPIs."
    >
      {error && <div className="auth-message auth-message--error admin-bento__alert">{error}</div>}
      {message && <div className="auth-message auth-message--success admin-bento__alert">{message}</div>}

      <section className="admin-bento" aria-label="Admin dashboard overview">
        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-slate">
          <span>GMV today</span>
          <strong>$0</strong>
          <p>No marketplace volume yet</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-blue">
          <span>Orders today</span>
          <strong>0</strong>
          <p>No orders recorded</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-amber">
          <span>Pending KYC</span>
          <strong>{pendingKyc}</strong>
          <p>Seller verification queue</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-violet">
          <span>Listing reviews</span>
          <strong>{pendingProducts}</strong>
          <p>Awaiting publication approval</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--wide admin-bento__cell--tall">
          <div className="admin-bento__head">
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

        <article className="admin-bento__cell">
          <div className="admin-bento__head">
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

        <article className="admin-bento__cell">
          <div className="admin-bento__head">
            <div>
              <h2>Priority actions</h2>
              <p>Tasks requiring admin attention</p>
            </div>
          </div>
          <div className="admin-action-list">
            <Link to="/admin/kyc">Review {pendingKyc} KYC submission{pendingKyc !== 1 ? 's' : ''}</Link>
            <Link to="/admin/products">Approve {pendingProducts} product listing{pendingProducts !== 1 ? 's' : ''}</Link>
            <Link to="/admin/categories">Category management</Link>
            <Link to="/admin/homepage-sections">Homepage sections</Link>
            <Link to="/admin/orders">View order operations</Link>
            <Link to="/admin/sellers">View seller directory</Link>
          </div>
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-2">
          <div className="admin-bento__head">
            <div>
              <h2>Seller KYC approval</h2>
              <p>Identity and business verification queue.</p>
            </div>
            <Link to="/admin/kyc" className="admin-btn admin-btn--ghost">Open KYC queue</Link>
          </div>
          {priorityKyc ? (
            <div className="admin-approval-card">
              <strong>{priorityKyc.businessName}</strong>
              <p>KYC ID: {priorityKyc.kycId}</p>
              <p>Seller: {priorityKyc.sellerEmail}</p>
              <p>Documents: Photo, Address proof, Tax ID proof</p>
              <p>Status: Pending review</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => void handleKycDecision(true)}>Approve KYC</button>
                <button type="button" className="admin-reject" onClick={() => void handleKycDecision(false)}>Reject KYC</button>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No pending KYC submissions</strong>
              <p>Seller verification requests will appear here.</p>
              <Link to="/admin/kyc">View all KYC requests</Link>
            </div>
          )}
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-2">
          <div className="admin-bento__head">
            <div>
              <h2>Product listing approval</h2>
              <p>Listings blocked until admin publishes them.</p>
            </div>
            <Link to="/admin/products" className="admin-btn admin-btn--ghost">Open product queue</Link>
          </div>
          {priorityProduct ? (
            <div className="admin-approval-card">
              <strong>{priorityProduct.productName}</strong>
              <p>SKU: {priorityProduct.sku}</p>
              <p>Seller: {priorityProduct.sellerEmail}</p>
              <p>Visibility: Hidden until approved</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => void handleProductDecision(true)}>Approve listing</button>
                <button type="button" className="admin-reject" onClick={() => void handleProductDecision(false)}>Reject listing</button>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No pending product listings</strong>
              <p>Seller submissions will appear here for review.</p>
              <Link to="/admin/products">View all product submissions</Link>
            </div>
          )}
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-3">
          <div className="admin-bento__head">
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
        </article>

        <article className="admin-bento__cell">
          <div className="admin-bento__head">
            <div>
              <h2>Platform activity</h2>
              <p>Audit trail of seller, order, and compliance events.</p>
            </div>
          </div>
          <PanelEmptyState
            title="No platform activity yet"
            message="Audit events will be recorded here as sellers and orders go live."
          />
        </article>
      </section>
    </AdminDashboardShell>
  )
}
