import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import {
  addProductToSection,
  fetchApprovedProductsBySeller,
  fetchSectionHighlights,
  fetchSellersWithApprovedProducts,
  HIGHLIGHT_SECTION_LIMIT,
  removeHighlight,
  updateHighlightSortOrder,
  type HighlightSection,
  type HighlightEntry,
} from '../lib/storefrontHighlights'

const sectionOptions: Array<{ id: HighlightSection; label: string; description: string }> = [
  {
    id: 'featured',
    label: 'Featured Products',
    description: 'Homepage sponsored featured carousel section.',
  },
  {
    id: 'trending',
    label: 'Trending Now',
    description: 'Homepage trending products section.',
  },
]

export function AdminStorefrontSectionsPage() {
  const [activeSection, setActiveSection] = useState<HighlightSection>('featured')
  const [sellers, setSellers] = useState<Awaited<ReturnType<typeof fetchSellersWithApprovedProducts>>>([])
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [sellerProducts, setSellerProducts] = useState<Awaited<ReturnType<typeof fetchApprovedProductsBySeller>>>([])
  const [highlights, setHighlights] = useState<HighlightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const sectionMeta = useMemo(
    () => sectionOptions.find((section) => section.id === activeSection) ?? sectionOptions[0],
    [activeSection],
  )

  const highlightedProductIds = useMemo(
    () => new Set(highlights.map((entry) => entry.productId)),
    [highlights],
  )

  const loadSection = async (sectionType: HighlightSection) => {
    setLoading(true)
    setError('')
    const [sellerRows, highlightRows] = await Promise.all([
      fetchSellersWithApprovedProducts(),
      fetchSectionHighlights(sectionType),
    ])
    setSellers(sellerRows)
    setHighlights(highlightRows)
    setLoading(false)
  }

  useEffect(() => {
    void loadSection(activeSection)
  }, [activeSection])

  useEffect(() => {
    if (!selectedSellerId) {
      setSellerProducts([])
      return
    }

    void fetchApprovedProductsBySeller(selectedSellerId).then(setSellerProducts)
  }, [selectedSellerId])

  const handleAddProduct = async (productId: number) => {
    setError('')
    setMessage('')
    setSaving(true)

    const result = await addProductToSection(productId, activeSection)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Product added to section.')
    await loadSection(activeSection)
  }

  const handleRemove = async (highlightId: number) => {
    setError('')
    setMessage('')
    setSaving(true)

    const result = await removeHighlight(highlightId)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Product removed from section.')
    await loadSection(activeSection)
  }

  const handleSortUpdate = async (highlight: HighlightEntry, sortOrder: number) => {
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      setError('Sort order must be zero or greater.')
      return
    }

    setError('')
    setMessage('')
    setSaving(true)

    const result = await updateHighlightSortOrder(highlight.id, sortOrder)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Sort order updated.')
    await loadSection(activeSection)
  }

  return (
    <AdminDashboardShell
      title="Homepage sections"
      subtitle="Curate Featured Products and Trending Now from approved seller listings."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Section manager</h2>
            <p>{sectionMeta.description}</p>
          </div>
          <div className="admin-section-tabs">
            {sectionOptions.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? 'is-active' : undefined}
                onClick={() => {
                  setActiveSection(section.id)
                  setSelectedSellerId('')
                  setSellerProducts([])
                  setMessage('')
                  setError('')
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <p className="admin-section-count">
          {highlights.length} / {HIGHLIGHT_SECTION_LIMIT} products in <strong>{sectionMeta.label}</strong>
        </p>

        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h2>Current {sectionMeta.label}</h2>
            <p>Edit sort order or remove products from this homepage section.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading section products...</p>
        ) : highlights.length === 0 ? (
          <PanelEmptyState
            title={`No products in ${sectionMeta.label}`}
            message="Select a seller below and add approved listings to this section."
          />
        ) : (
          <div className="admin-table admin-table--highlights">
            <div className="admin-table__row admin-table__row--head">
              <span>Product</span><span>SKU</span><span>Seller</span><span>Sort</span><span>Actions</span>
            </div>
            {highlights.map((entry) => (
              <div className="admin-table__row" key={entry.id}>
                <span>{entry.productName}<small>{entry.brandName}</small></span>
                <span>{entry.sku}</span>
                <span>{entry.sellerBusinessName}</span>
                <span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={entry.sortOrder}
                    onBlur={(event) => {
                      const next = Number.parseInt(event.target.value, 10)
                      if (next !== entry.sortOrder) {
                        void handleSortUpdate(entry, next)
                      }
                    }}
                  />
                </span>
                <span className="admin-form__actions">
                  <button type="button" className="admin-reject" disabled={saving} onClick={() => void handleRemove(entry.id)}>
                    Remove
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <h2>Add from seller listings</h2>
            <p>Select a seller to view approved products and add them to {sectionMeta.label}.</p>
          </div>
        </div>

        <form className="admin-form admin-form--grid">
          <label>
            Seller
            <select
              value={selectedSellerId}
              onChange={(event) => setSelectedSellerId(event.target.value)}
            >
              <option value="">Select seller</option>
              {sellers.map((seller) => (
                <option key={seller.userId} value={seller.userId}>
                  {seller.businessName} ({seller.productCount} approved)
                </option>
              ))}
            </select>
          </label>
        </form>

        {!selectedSellerId ? (
          <PanelEmptyState
            title="Select a seller"
            message="Only sellers with approved marketplace listings can be used."
          />
        ) : sellerProducts.length === 0 ? (
          <PanelEmptyState
            title="No approved products"
            message="This seller has no approved listings yet."
          />
        ) : (
          <div className="admin-table admin-table--highlights">
            <div className="admin-table__row admin-table__row--head">
              <span>Product</span><span>SKU</span><span>Category</span><span>Status</span><span>Actions</span>
            </div>
            {sellerProducts.map((product) => {
              const alreadyAdded = highlightedProductIds.has(product.id)
              const sectionFull = highlights.length >= HIGHLIGHT_SECTION_LIMIT

              return (
                <div className="admin-table__row" key={product.id}>
                  <span>{product.productName}<small>{product.brandName}</small></span>
                  <span>{product.sku}</span>
                  <span>{product.categoryName} / {product.subCategoryName}</span>
                  <span>{alreadyAdded ? 'In section' : 'Available'}</span>
                  <span className="admin-form__actions">
                    <button
                      type="button"
                      className="admin-accept"
                      disabled={saving || alreadyAdded || sectionFull}
                      onClick={() => void handleAddProduct(product.id)}
                    >
                      Add
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <Link to="/" className="admin-btn admin-btn--ghost">Preview homepage</Link>
      </section>
    </AdminDashboardShell>
  )
}
