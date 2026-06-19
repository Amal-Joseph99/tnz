import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
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

  const handleDecision = async (productId: number, approved: boolean) => {
    setError('')
    setMessage('')

    const result = await reviewSellerProduct(
      productId,
      approved,
      approved ? undefined : 'Listing did not meet marketplace compliance requirements.',
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'Product listing approved.' : 'Product listing rejected.')
    await loadQueue(filter)
  }

  return (
    <AdminDashboardShell
      title="Products"
      subtitle="Review product listings, compliance, and marketplace visibility."
    >
      {priority && (
        <section className="admin-panel admin-panel--highlight">
          <div className="admin-panel__header">
            <h2>Priority listing review</h2>
            <p>Active submission awaiting admin decision.</p>
          </div>
          <div className="admin-approval-card">
            <strong>{priority.productName}</strong>
            <p>SKU: {priority.sku} · HSN: {priority.hsnCode}</p>
            <p>Seller: {priority.sellerEmail} · {priority.sellerBusinessName}</p>
            <p>Category: {priority.categoryName} / {priority.subCategoryName} / {priority.productTypeName}</p>
            <p>Status: Awaiting admin approval before public listing</p>
            <div className="admin-approval-card__actions">
              <button type="button" className="admin-accept" onClick={() => void handleDecision(priority.id, true)}>Approve listing</button>
              <button type="button" className="admin-reject" onClick={() => void handleDecision(priority.id, false)}>Reject listing</button>
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
          <select aria-label="Filter product status" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}
        {loading ? (
          <p>Loading product queue...</p>
        ) : queue.length === 0 ? (
          <PanelEmptyState
            title="No product submissions"
            message="Seller listings awaiting review will appear in this queue."
          />
        ) : (
          <div className="admin-table admin-table--categories">
            <div className="admin-table__row admin-table__row--head">
              <span>Product</span><span>SKU</span><span>Seller</span><span>Status</span><span>Actions</span>
            </div>
            {queue.map((item) => (
              <div className="admin-table__row" key={item.id}>
                <span>{item.productName}</span>
                <span>{item.sku}</span>
                <span>{item.sellerEmail}</span>
                <span>{item.approvalStatus}</span>
                <span className="admin-form__actions">
                  {item.approvalStatus === 'pending' && (
                    <>
                      <button type="button" className="admin-accept" onClick={() => void handleDecision(item.id, true)}>Approve</button>
                      <button type="button" className="admin-reject" onClick={() => void handleDecision(item.id, false)}>Reject</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
