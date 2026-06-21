import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { SellerProductConfirmDialog } from '../components/SellerProductConfirmDialog'
import {
  computeSellerProductCatalogueStats,
  deleteSellerProduct,
  fetchSellerProductCatalogue,
  filterSellerProductsByTab,
  SELLER_PRODUCT_LISTING_TUTORIAL_URL,
  SELLER_PRODUCTS_PAGE_SIZE,
  type SellerProductCatalogueRow,
} from '../lib/sellerProducts'
import { getSignedStorageUrl } from '../lib/sellerStorage'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

type ProductTab = 'draft' | 'approved' | 'rejected'

type ConfirmState =
  | { type: 'modify'; product: SellerProductCatalogueRow }
  | { type: 'remove'; product: SellerProductCatalogueRow }
  | null

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').toUpperCase()
}

function parseTab(value: string | null): ProductTab {
  if (value === 'approved' || value === 'rejected') return value
  return 'draft'
}

function parsePage(value: string | null) {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export function SellerProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [catalogue, setCatalogue] = useState<SellerProductCatalogueRow[]>([])
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  const activeTab = parseTab(searchParams.get('status'))
  const currentPage = parsePage(searchParams.get('page'))

  const loadCatalogue = async () => {
    const [workflowState, rows] = await Promise.all([
      fetchSellerWorkflow(),
      fetchSellerProductCatalogue(),
    ])
    setWorkflow(workflowState)
    setCatalogue(rows)

    const urls: Record<number, string> = {}
    await Promise.all(
      rows.map(async (row) => {
        if (!row.imageStoragePath) return
        const url = await getSignedStorageUrl('seller-products', row.imageStoragePath)
        if (url) urls[row.id] = url
      }),
    )
    setImageUrls(urls)
  }

  useEffect(() => {
    void loadCatalogue().finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => computeSellerProductCatalogueStats(catalogue), [catalogue])
  const filteredRows = useMemo(() => filterSellerProductsByTab(catalogue, activeTab), [catalogue, activeTab])
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / SELLER_PRODUCTS_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRows = filteredRows.slice(
    (safePage - 1) * SELLER_PRODUCTS_PAGE_SIZE,
    safePage * SELLER_PRODUCTS_PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage !== safePage) {
      const next = new URLSearchParams(searchParams)
      next.set('page', String(safePage))
      setSearchParams(next, { replace: true })
    }
  }, [currentPage, safePage, searchParams, setSearchParams])

  const updateQuery = (tab: ProductTab, page = 1) => {
    const next = new URLSearchParams()
    next.set('status', tab)
    next.set('page', String(page))
    setSearchParams(next)
  }

  const handleAddProduct = () => {
    if (!workflow?.warehouseCompleted) {
      setError('Complete warehouse setup before adding products.')
      return
    }
    navigate('/seller/products/new')
  }

  const handleConfirmAction = async () => {
    if (!confirmState) return

    if (confirmState.type === 'modify') {
      setConfirmState(null)
      navigate(`/seller/products/${confirmState.product.id}/edit`)
      return
    }

    const result = await deleteSellerProduct(confirmState.product.id)
    setConfirmState(null)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(`Removed ${confirmState.product.productName} from your catalogue.`)
    await loadCatalogue()
  }

  if (loading || !workflow) {
    return (
      <SellerDashboardShell title="Products" subtitle="Manage your catalogue, stock, and listing approvals.">
        <p>Loading products...</p>
      </SellerDashboardShell>
    )
  }

  return (
    <SellerDashboardShell title="Products" subtitle="Manage your catalogue, stock, and listing approvals.">
      <section className="seller-product-highlights">
        <article>
          <span>Total live products</span>
          <strong>{stats.liveProducts}</strong>
        </article>
        <article>
          <span>Low stock</span>
          <strong>{stats.lowStock}</strong>
        </article>
        <article>
          <span>Out of stock</span>
          <strong>{stats.outOfStock}</strong>
        </article>
      </section>

      <section className="seller-console-card seller-products-card">
        <div className="seller-products-toolbar">
          <div className="seller-products-toolbar__left">
            <div className="seller-segmented-control" role="tablist" aria-label="Product status filter">
              {(['draft', 'approved', 'rejected'] as ProductTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? 'seller-segmented-control__btn seller-segmented-control__btn--active' : 'seller-segmented-control__btn'}
                  onClick={() => updateQuery(tab, 1)}
                >
                  {tab === 'draft' ? 'Draft' : tab === 'approved' ? 'Approved' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          <div className="seller-products-toolbar__right">
            <a
              href={SELLER_PRODUCT_LISTING_TUTORIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="seller-secondary-action seller-inline-link-button"
            >
              Tutorial for listing
            </a>
            <button type="button" className="seller-primary-action" onClick={handleAddProduct}>
              Add product
            </button>
          </div>
        </div>

        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}

        {pageRows.length === 0 ? (
          <PanelEmptyState
            title={`No ${activeTab} products`}
            message="Use Add product to create a new listing for admin approval."
          />
        ) : (
          <>
            <div className="seller-product-list">
              <div className="seller-product-list__row seller-product-list__row--head">
                <span>Product</span>
                <span>SKU</span>
                <span>MRP</span>
                <span>Sell price</span>
                <span>Qty</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {pageRows.map((row) => (
                <div className="seller-product-list__row" key={row.id}>
                  <div className="seller-product-list__product">
                    {imageUrls[row.id] ? (
                      <img src={imageUrls[row.id]} alt={row.productName} className="seller-product-list__thumb" />
                    ) : (
                      <div className="seller-product-list__thumb seller-product-list__thumb--empty">No image</div>
                    )}
                    <strong>{row.productName}</strong>
                  </div>
                  <span>{row.sku}</span>
                  <span>{formatMoney(row.mrp)}</span>
                  <span>{formatMoney(row.sellingPrice)}</span>
                  <span>{row.stock}</span>
                  <span className={`seller-product-status seller-product-status--${row.approvalStatus}`}>
                    {formatStatus(row.approvalStatus)}
                  </span>
                  <div className="seller-product-list__actions">
                    <button
                      type="button"
                      className="seller-secondary-action"
                      disabled={row.approvalStatus === 'pending'}
                      onClick={() => setConfirmState({ type: 'modify', product: row })}
                    >
                      Modify
                    </button>
                    <button
                      type="button"
                      className="seller-secondary-action seller-product-list__remove"
                      onClick={() => setConfirmState({ type: 'remove', product: row })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="seller-product-pagination">
              <span>Page {safePage} of {totalPages}</span>
              <button
                type="button"
                className="seller-secondary-action"
                disabled={safePage >= totalPages}
                onClick={() => updateQuery(activeTab, safePage + 1)}
              >
                Next page
              </button>
            </div>
          </>
        )}
      </section>

      {!workflow.warehouseCompleted ? (
        <p className="seller-products-footnote">
          Complete <Link to="/seller/warehouse">warehouse setup</Link> to add new products.
        </p>
      ) : null}

      <SellerProductConfirmDialog
        open={confirmState !== null}
        title={confirmState?.type === 'remove' ? 'Remove product' : 'Modify product'}
        message={
          confirmState?.type === 'remove'
            ? `Remove ${confirmState.product.productName} from your catalogue? This cannot be undone.`
            : confirmState?.product.approvalStatus === 'approved'
              ? `Modify ${confirmState.product.productName}? Approved listings must be resubmitted for admin approval.`
              : `Open ${confirmState?.product.productName ?? 'this product'} for editing?`
        }
        confirmLabel={confirmState?.type === 'remove' ? 'Confirm remove' : 'Continue to modify'}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </SellerDashboardShell>
  )
}
