import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import {
  fetchKycQueue,
  fetchPendingApprovalCounts,
  fetchProductQueue,
  reviewSellerKyc,
  reviewSellerProduct,
  type KycQueueItem,
} from '../lib/adminApprovals'

export function AdminDashboardPage() {
  const [pendingKyc, setPendingKyc] = useState(0)
  const [pendingProducts, setPendingProducts] = useState(0)
  const [priorityKyc, setPriorityKyc] = useState<KycQueueItem | null>(null)
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
    setPriorityKyc(kycQueue.items[0] ?? null)
    if (kycQueue.error) {
      setError(kycQueue.error)
    }
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
    <AdminDashboardShell title="Dashboard">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="admin-bento" aria-label="Admin dashboard overview">
        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-slate">
          <span>GMV today</span>
          <strong>$0</strong>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-blue">
          <span>Orders today</span>
          <strong>0</strong>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-amber">
          <span>Pending KYC</span>
          <strong>{pendingKyc}</strong>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--accent-violet">
          <span>Listing reviews</span>
          <strong>{pendingProducts}</strong>
        </article>

        <article className="admin-bento__cell admin-bento__cell--wide admin-bento__cell--tall">
          <div className="admin-bento__head">
            <h2>Marketplace volume</h2>
            <Link to="/admin/orders" className="admin-btn admin-btn--ghost">Orders</Link>
          </div>
          <div className="admin-bento__empty">No data</div>
        </article>

        <article className="admin-bento__cell">
          <h2 className="admin-bento__title">Platform health</h2>
          <div className="admin-status-list">
            <div><strong>Payments</strong><span className="admin-status-pill admin-status-pill--ok">OK</span></div>
            <div><strong>Onboarding</strong><span className="admin-status-pill admin-status-pill--warn">{pendingKyc}</span></div>
            <div><strong>Disputes</strong><span className="admin-status-pill admin-status-pill--ok">0</span></div>
            <div><strong>Payouts</strong><span className="admin-status-pill admin-status-pill--ok">OK</span></div>
          </div>
        </article>

        <article className="admin-bento__cell">
          <h2 className="admin-bento__title">Quick links</h2>
          <div className="admin-action-list">
            <Link to="/admin/kyc">KYC ({pendingKyc})</Link>
            <Link to="/admin/products">Products ({pendingProducts})</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/sellers">Sellers</Link>
          </div>
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-2">
          <div className="admin-bento__head">
            <h2>KYC queue</h2>
            <Link to="/admin/kyc" className="admin-btn admin-btn--ghost">Open</Link>
          </div>
          {priorityKyc ? (
            <div className="admin-approval-card">
              <strong>{priorityKyc.businessName}</strong>
              <p>{priorityKyc.sellerEmail}</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => void handleKycDecision(true)}>Approve</button>
                <button type="button" className="admin-reject" onClick={() => void handleKycDecision(false)}>Reject</button>
              </div>
            </div>
          ) : (
            <div className="admin-bento__empty">Queue empty</div>
          )}
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-2">
          <div className="admin-bento__head">
            <h2>Product queue</h2>
            <Link to="/admin/products" className="admin-btn admin-btn--ghost">Open</Link>
          </div>
          {priorityProduct ? (
            <div className="admin-approval-card">
              <strong>{priorityProduct.productName}</strong>
              <p>{priorityProduct.sellerEmail}</p>
              <div className="admin-approval-card__actions">
                <button type="button" className="admin-accept" onClick={() => void handleProductDecision(true)}>Approve</button>
                <button type="button" className="admin-reject" onClick={() => void handleProductDecision(false)}>Reject</button>
              </div>
            </div>
          ) : (
            <div className="admin-bento__empty">Queue empty</div>
          )}
        </article>

        <article className="admin-bento__cell admin-bento__cell--span-3">
          <div className="admin-bento__head">
            <h2>Recent orders</h2>
            <Link to="/admin/orders" className="admin-btn admin-btn--ghost">Open</Link>
          </div>
          <div className="admin-bento__empty">No orders</div>
        </article>

        <article className="admin-bento__cell">
          <h2 className="admin-bento__title">Activity</h2>
          <div className="admin-bento__empty">No events</div>
        </article>
      </section>
    </AdminDashboardShell>
  )
}
