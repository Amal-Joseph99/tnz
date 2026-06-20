import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { RejectionReasonDialog } from '../components/RejectionReasonDialog'
import {
  fetchAdminProductDetail,
  fetchProductQueue,
  reviewSellerProduct,
  type AdminProductDetail,
  type ProductQueueItem,
} from '../lib/adminApprovals'
import { getSignedStorageUrl } from '../lib/sellerStorage'

export function AdminProductsPage() {
  const [queue, setQueue] = useState<ProductQueueItem[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [detail, setDetail] = useState<AdminProductDetail | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
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

  useEffect(() => {
    if (!selectedProductId) {
      setDetail(null)
      setMediaUrls({})
      return
    }

    void fetchAdminProductDetail(selectedProductId).then(async (nextDetail) => {
      setDetail(nextDetail)
      if (!nextDetail) return

      const urls: Record<string, string> = {}
      await Promise.all(
        nextDetail.media.map(async (item) => {
          const url = await getSignedStorageUrl('seller-products', item.storagePath)
          if (url) urls[item.storagePath] = url
        }),
      )
      setMediaUrls(urls)
    })
  }, [selectedProductId])

  const pending = queue.filter((item) => item.approvalStatus === 'pending')
  const priority = pending[0]

  useEffect(() => {
    if (priority) {
      setSelectedProductId(priority.id)
    }
  }, [priority?.id])

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
    if (selectedProductId === productId) {
      setSelectedProductId(null)
    }
    await loadQueue(filter)
  }

  const renderDetail = (item: ProductQueueItem, detailData: AdminProductDetail | null) => (
    <div className="admin-approval-card">
      <strong>{item.productName}</strong>
      <p>SKU: {item.sku} · HSN: {item.hsnCode}</p>
      <p>Seller: {item.sellerEmail} · {item.sellerBusinessName}</p>
      <p>Category: {item.categoryName} / {item.subCategoryName} / {item.productTypeName}</p>
      {detailData && (
        <>
          <p>Brand: {String(detailData.product.brand_name ?? '')}</p>
          <p>{String(detailData.product.short_description ?? '')}</p>
          <div className="spec-table">
            <div className="spec-table__row spec-table__row--head"><span>Attribute</span><span>Value</span></div>
            {detailData.specifications.map((spec, index) => (
              <div className="spec-table__row" key={`${spec.attributeName}-${index}`}>
                <span>{spec.attributeName}</span>
                <span>{spec.attributeValue}</span>
              </div>
            ))}
          </div>
          <div className="variant-table">
            <div className="variant-table__row variant-table__row--head">
              <span>Variant</span><span>Size</span><span>Colour</span><span>MRP</span><span>Price</span><span>Stock</span>
            </div>
            {detailData.variants.map((variant) => (
              <div className="variant-table__row" key={variant.variantId}>
                <span>{variant.variantId}</span>
                <span>{variant.size}</span>
                <span>{variant.color}</span>
                <span>{variant.mrp}</span>
                <span>{variant.sellingPrice}</span>
                <span>{variant.stock}</span>
              </div>
            ))}
          </div>
          <div className="listing-media-grid">
            {detailData.media.map((item) => (
              <article key={item.storagePath} className="listing-media-card">
                <strong>{item.mediaType}</strong>
                <p>{item.fileName}</p>
                {mediaUrls[item.storagePath] ? (
                  item.mimeType.startsWith('video/') ? (
                    <video src={mediaUrls[item.storagePath]} controls />
                  ) : (
                    <img src={mediaUrls[item.storagePath]} alt={item.fileName} />
                  )
                ) : (
                  <span>Preview unavailable</span>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {item.approvalStatus === 'pending' && (
        <div className="admin-approval-card__actions">
          <button type="button" className="admin-accept" onClick={() => void handleDecision(item.id, true)}>Approve listing</button>
          <button type="button" className="admin-reject" onClick={() => setRejectTarget(item.id)}>Reject listing</button>
        </div>
      )}
    </div>
  )

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
          {renderDetail(priority, selectedProductId === priority.id ? detail : null)}
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
                  <button type="button" onClick={() => setSelectedProductId(item.id)}>View</button>
                  {item.approvalStatus === 'pending' && (
                    <>
                      <button type="button" className="admin-accept" onClick={() => void handleDecision(item.id, true)}>Approve</button>
                      <button type="button" className="admin-reject" onClick={() => setRejectTarget(item.id)}>Reject</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedProductId && detail && (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Listing detail</h2>
            <p>Specifications, variants, and media for selected product.</p>
          </div>
          {renderDetail(queue.find((item) => item.id === selectedProductId) ?? {
            id: selectedProductId,
            userId: String(detail.product.user_id ?? ''),
            sku: String(detail.product.sku ?? ''),
            productName: String(detail.product.product_name ?? ''),
            categoryName: String(detail.product.category_name ?? ''),
            subCategoryName: String(detail.product.sub_category_name ?? ''),
            productTypeName: String(detail.product.product_type_name ?? ''),
            hsnCode: String(detail.product.hsn_code ?? ''),
            brandName: String(detail.product.brand_name ?? ''),
            approvalStatus: String(detail.product.approval_status ?? ''),
            submittedAt: null,
            reviewedAt: null,
            rejectionReason: null,
            sellerEmail: String(detail.product.sellerEmail ?? ''),
            sellerBusinessName: String(detail.product.sellerBusinessName ?? ''),
          }, detail)}
        </section>
      )}

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
