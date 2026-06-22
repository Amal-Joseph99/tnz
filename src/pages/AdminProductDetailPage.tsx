import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { AdminProductVerificationForm } from '../components/AdminProductVerificationForm'
import { RejectionReasonDialog } from '../components/RejectionReasonDialog'
import {
  fetchAdminProductDetail,
  fetchProductQueue,
  reviewSellerProduct,
  type AdminProductDetail,
  type ProductQueueItem,
} from '../lib/adminApprovals'
import { fetchProductListingDisplayOptions } from '../lib/productListingDisplay'
import type { ProductListingWizardOptions } from '../lib/productListingWizard'
import { getSignedStorageUrl } from '../lib/sellerStorage'

function queueItemFromDetail(productId: number, detail: AdminProductDetail): ProductQueueItem {
  const product = detail.product
  return {
    id: productId,
    userId: String(product.user_id ?? ''),
    sku: String(product.sku ?? ''),
    productName: String(product.product_name ?? ''),
    categoryName: String(product.category_name ?? ''),
    subCategoryName: String(product.sub_category_name ?? ''),
    productTypeName: String(product.product_type_name ?? ''),
    hsnCode: String(product.hsn_code ?? ''),
    brandName: String(product.brand_name ?? ''),
    approvalStatus: String(product.approval_status ?? ''),
    submittedAt: product.submitted_at ? String(product.submitted_at) : null,
    reviewedAt: product.reviewed_at ? String(product.reviewed_at) : null,
    rejectionReason: product.rejection_reason ? String(product.rejection_reason) : null,
    sellerEmail: String(product.sellerEmail ?? ''),
    sellerBusinessName: String(product.sellerBusinessName ?? ''),
  }
}

export function AdminProductDetailPage() {
  const navigate = useNavigate()
  const { productId: productIdParam } = useParams()
  const productId = Number(productIdParam)

  const [queueItem, setQueueItem] = useState<ProductQueueItem | null>(null)
  const [detail, setDetail] = useState<AdminProductDetail | null>(null)
  const [listingOptions, setListingOptions] = useState<ProductListingWizardOptions | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const [variantImageUrls, setVariantImageUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(productId) || productId <= 0) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError('')

    void Promise.all([
      fetchAdminProductDetail(productId),
      fetchProductQueue(),
      fetchProductListingDisplayOptions(),
    ])
      .then(async ([nextDetail, queue, options]) => {
        if (!active) return

        setListingOptions(options)
        setDetail(nextDetail)

        const matched = queue.find((item) => item.id === productId)
        if (matched) {
          setQueueItem(matched)
        } else if (nextDetail) {
          setQueueItem(queueItemFromDetail(productId, nextDetail))
        } else {
          setQueueItem(null)
        }

        if (!nextDetail) return

        const urls: Record<string, string> = {}
        const variantUrls: Record<string, string> = {}

        await Promise.all([
          ...nextDetail.media.map(async (item) => {
            const url = await getSignedStorageUrl('seller-products', item.storagePath)
            if (url) urls[item.storagePath] = url
          }),
          ...nextDetail.variants.map(async (variant) => {
            if (!variant.imageStoragePath) return
            const url = await getSignedStorageUrl('seller-products', variant.imageStoragePath)
            if (url) variantUrls[variant.imageStoragePath] = url
          }),
        ])

        if (active) {
          setMediaUrls(urls)
          setVariantImageUrls(variantUrls)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  const handleDecision = async (approved: boolean, rejectionReason?: string) => {
    if (!productId) return

    setError('')
    setMessage('')

    const result = await reviewSellerProduct(productId, approved, rejectionReason)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'Product listing approved.' : 'Product listing rejected.')
    setRejectOpen(false)
    navigate('/admin/products')
  }

  if (!Number.isFinite(productId) || productId <= 0) {
    return (
      <AdminDashboardShell title="Product review" subtitle="Invalid product listing.">
        <p>Product not found.</p>
        <Link to="/admin/products" className="admin-btn admin-btn--ghost">Back to products</Link>
      </AdminDashboardShell>
    )
  }

  return (
    <AdminDashboardShell title="Product review" hidePageHeading>
      <div className="admin-page-toolbar admin-page-toolbar--compact">
        <Link to="/admin/products" className="admin-btn admin-btn--sm admin-btn--ghost">← Back to products</Link>
      </div>

      {error ? <div className="auth-message auth-message--error">{error}</div> : null}
      {message ? <div className="auth-message auth-message--success">{message}</div> : null}

      {loading ? (
        <p>Loading listing detail...</p>
      ) : !queueItem || !detail ? (
        <p>Listing detail unavailable.</p>
      ) : (
        <AdminProductVerificationForm
          item={queueItem}
          detail={detail}
          options={
            listingOptions ?? {
              itemConditions: [],
              warrantyPeriods: [],
              dimensionUnits: [],
              weightUnits: [],
              returnWindows: [],
              returnReasonTypes: [],
              sizePresets: [],
              colorPresets: [],
            }
          }
          mediaUrls={mediaUrls}
          variantImageUrls={variantImageUrls}
          onApprove={queueItem.approvalStatus === 'pending' ? () => void handleDecision(true) : undefined}
          onReject={queueItem.approvalStatus === 'pending' ? () => setRejectOpen(true) : undefined}
        />
      )}

      <RejectionReasonDialog
        rejectionType="product"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onConfirm={(reason) => void handleDecision(false, reason)}
      />
    </AdminDashboardShell>
  )
}
