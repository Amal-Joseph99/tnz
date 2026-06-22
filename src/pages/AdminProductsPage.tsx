import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { RejectionReasonDialog } from '../components/RejectionReasonDialog'
import {
  fetchProductQueue,
  reviewSellerProduct,
  type ProductQueueItem,
} from '../lib/adminApprovals'

export function AdminProductsPage() {
  const [queue, setQueue] = useState<ProductQueueItem[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rejectTarget, setRejectTarget] = useState<number | null>(null)

  const loadQueue = async (status: string) => {
    setLoading(true)
    const rows = await fetchProductQueue(status === 'all' ? undefined : status)
    setQueue(rows)
    setLoading(false)
  }

  useEffect(() => {
    void loadQueue(filter)
  }, [filter])

  const pending = queue.filter((item) => item.approvalStatus === 'pending')
  const priority = pending[0]

  const handleDecision = async (productId: number, approved: boolean, rejectionReason?: string) => {
    setError('')
    setMessage('')

    const result = await reviewSellerProduct(productId, approved, rejectionReason)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'Product listing approved.' : 'Product listing rejected.')
    setRejectTarget(null)
    await loadQueue(filter)
  }

  return (
    <AdminDashboardShell
      title="Products"
      subtitle="Review product listings, compliance, and marketplace visibility."
    >
      {priority ? (
        <section className="admin-panel admin-panel--highlight">
          <div className="admin-panel__header">
            <h2>Priority listing review</h2>
            <p>Active submission awaiting admin decision.</p>
          </div>
          <div className="admin-priority-card">
            <div>
              <strong>{priority.productName}</strong>
              <p>{priority.sellerBusinessName} · {priority.sellerEmail}</p>
            </div>
            <Link to={`/admin/products/${priority.id}`} className="admin-btn">
              Review listing
            </Link>
          </div>
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Product approval queue</h2>
            <p>Listings submitted by sellers for marketplace publication.</p>
          </div>
          <select aria-label="Filter product status" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}
        {message ? <div className="auth-message auth-message--success">{message}</div> : null}
        {loading ? (
          <p>Loading product queue...</p>
        ) : queue.length === 0 ? (
          <PanelEmptyState
            title="No product submissions"
            message="Seller listings awaiting review will appear in this queue."
          />
        ) : (
          <div className="admin-table admin-table--products">
            <div className="admin-table__row admin-table__row--head">
              <span>Product</span><span>SKU</span><span>Seller</span><span>Status</span><span>Actions</span>
            </div>
            {queue.map((item) => (
              <div className="admin-table__row" key={item.id}>
                <span className="admin-table__cell" data-label="Product">{item.productName}</span>
                <span className="admin-table__cell" data-label="SKU">{item.sku}</span>
                <span className="admin-table__cell" data-label="Seller">{item.sellerEmail}</span>
                <span className="admin-table__cell" data-label="Status">{item.approvalStatus}</span>
                <span className="admin-form__actions admin-table__cell" data-label="Actions">
                  <Link to={`/admin/products/${item.id}`} className="admin-btn admin-btn--ghost">
                    View
                  </Link>
                  {item.approvalStatus === 'pending' ? (
                    <>
                      <button type="button" className="admin-accept" onClick={() => void handleDecision(item.id, true)}>
                        Approve
                      </button>
                      <button type="button" className="admin-reject" onClick={() => setRejectTarget(item.id)}>
                        Reject
                      </button>
                    </>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <RejectionReasonDialog
        rejectionType="product"
        open={rejectTarget !== null}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) void handleDecision(rejectTarget, false, reason)
        }}
      />
    </AdminDashboardShell>
  )
}
