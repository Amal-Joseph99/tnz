import { useEffect, useMemo, useState } from 'react'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import {
  buildCategoryTree,
  fetchCategoryTaxonomy,
  getHsnFromTree,
  type CategoryTree,
} from '../lib/catalogCategories'
import { getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

const uploadTiles = [
  { label: 'Image 1', progress: 100 },
  { label: 'Image 2', progress: 100 },
  { label: 'Image 3', progress: 100 },
  { label: 'Image 4', progress: 100 },
  { label: 'Image 5', progress: 100 },
]

function createSku(productName: string) {
  const prefix = productName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')

  return `AGT-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
}

function createVariantId(size: string, color: string, index: number) {
  if (size === 'Free Size') return 'AGT-DEFAULT-VAR'
  return `AGT-VAR-${size.slice(0, 2).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${index + 1}`
}

export function SellerProductsPage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)
  const [categoryTree, setCategoryTree] = useState<CategoryTree>({})
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [productType, setProductType] = useState('')
  const [brandName, setBrandName] = useState('')
  const [sku, setSku] = useState('')
  const [sizeMode, setSizeMode] = useState('Free Size')
  const [colorMode, setColorMode] = useState('Black')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchCategoryTaxonomy()
      .then((rows) => {
        if (!active) return
        const tree = buildCategoryTree(rows)
        setCategoryTree(tree)

        const firstCategory = Object.keys(tree)[0]
        if (!firstCategory) {
          setCategory('')
          setSubCategory('')
          setProductType('')
          return
        }

        const firstSubCategory = Object.keys(tree[firstCategory])[0]
        const firstProductType = tree[firstCategory][firstSubCategory]?.productTypes[0] ?? ''

        setCategory(firstCategory)
        setSubCategory(firstSubCategory)
        setProductType(firstProductType)
      })
      .catch(() => {
        if (active) setCategoryTree({})
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categoryNames = useMemo(() => Object.keys(categoryTree), [categoryTree])
  const subCategories = useMemo(
    () => (category ? Object.keys(categoryTree[category] ?? {}) : []),
    [category, categoryTree],
  )
  const productTypes = useMemo(
    () => (category && subCategory ? categoryTree[category]?.[subCategory]?.productTypes ?? [] : []),
    [category, subCategory, categoryTree],
  )
  const hsnCode = getHsnFromTree(categoryTree, category, subCategory, productType)
  const variantRows = [
    { size: sizeMode, color: colorMode, mrp: '$149.00', selling: '$128.40', stock: '42' },
    ...(sizeMode === 'Free Size'
      ? []
      : [{ size: 'L', color: 'Blue', mrp: '$159.00', selling: '$139.00', stock: '24' }]),
  ]

  const handleProductInfoSave = () => {
    setError('')
    setMessage('')

    if (!productName.trim()) {
      setError('Product name is required.')
      return
    }

    if (!brandName.trim()) {
      setError('Brand name is required.')
      return
    }

    const generatedSku = createSku(productName)
    setSku(generatedSku)
    setMessage(`Product information saved to DB. SKU generated: ${generatedSku}.`)
  }

  const handleSubmitProduct = () => {
    setError('')
    setMessage('')

    if (!sku) {
      setError('Save product information first to generate SKU.')
      return
    }

    const nextWorkflow = updateSellerWorkflow((state) => ({
      ...state,
      productName,
      productApprovalStatus: 'pending',
    }))
    setWorkflow(nextWorkflow)
    setMessage('Product listing saved and submitted for admin approval. It will not be public until admin approves it.')
  }

  if (!workflow.warehouseCompleted) {
    return (
      <SellerDashboardShell title="Products" subtitle="Product listing unlocks after approved KYC and warehouse setup.">
        <section className="seller-console-card seller-gate-card">
          <h2>Product listing locked</h2>
          <p>Complete admin-approved KYC and save your warehouse address before creating product listings.</p>
          <div className="seller-status-list">
            <div><strong>KYC status</strong><span>{workflow.kycStatus.replace('_', ' ')}</span></div>
            <div><strong>Warehouse setup</strong><span>{workflow.warehouseCompleted ? 'Completed' : 'Pending'}</span></div>
          </div>
        </section>
      </SellerDashboardShell>
    )
  }

  return (
    <SellerDashboardShell title="Products" subtitle="Create listings, manage pricing, stock, and marketplace visibility.">
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Product information</h2>
            <p>Category, sub category, and product type decide the readonly 8-digit HSN code at DB level.</p>
          </div>
          <span className="seller-badge">Admin approval required</span>
        </div>

        <form className="seller-console-form">
          <label>Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} /></label>
          {loadingCategories ? (
            <p>Loading category taxonomy...</p>
          ) : categoryNames.length === 0 ? (
            <PanelEmptyState
              title="No categories configured"
              message="Ask an administrator to add category, sub category, product type, and HSN mappings before listing products."
            />
          ) : (
            <>
          <label>
            Category
            <select value={category} onChange={(event) => {
              const nextCategory = event.target.value
              const nextSubCategory = Object.keys(categoryTree[nextCategory] ?? {})[0] ?? ''
              const nextProductType = categoryTree[nextCategory]?.[nextSubCategory]?.productTypes[0] ?? ''
              setCategory(nextCategory)
              setSubCategory(nextSubCategory)
              setProductType(nextProductType)
            }}>
              {categoryNames.map((categoryName) => <option key={categoryName} value={categoryName}>{categoryName}</option>)}
            </select>
          </label>
          <label>
            Sub category
            <select value={subCategory} onChange={(event) => {
              const nextSubCategory = event.target.value
              setSubCategory(nextSubCategory)
              setProductType(categoryTree[category]?.[nextSubCategory]?.productTypes[0] ?? '')
            }}>
              {subCategories.map((subCategoryName) => <option key={subCategoryName} value={subCategoryName}>{subCategoryName}</option>)}
            </select>
          </label>
          <label>
            Product type
            <select value={productType} onChange={(event) => setProductType(event.target.value)}>
              {productTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>HSN code<input value={hsnCode} readOnly aria-label="Readonly 8 digit HSN code" /></label>
            </>
          )}
          <label>Brand name<input value={brandName} onChange={(event) => setBrandName(event.target.value)} /></label>
          <label className="seller-console-form__full">Short description<textarea placeholder="Short product summary" maxLength={250} /></label>
        </form>

        <div className="product-listing-block">
          <h3>Specifications</h3>
          <div className="spec-table">
            <div className="spec-table__row spec-table__row--head"><span>Attribute</span><span>Value</span></div>
            <div className="spec-table__row"><input defaultValue="Material" /><input defaultValue="ABS plastic and memory foam" /></div>
            <div className="spec-table__row"><input defaultValue="Warranty" /><input defaultValue="1 year manufacturer warranty" /></div>
            <div className="spec-table__row"><input defaultValue="Model" /><input defaultValue="AGT-AUDIO-2401" /></div>
            <div className="spec-table__row"><input defaultValue="Compatibility" /><input defaultValue="Android, iOS, Windows" /></div>
          </div>
          <button type="button" className="seller-secondary-action">Add specification row</button>
        </div>

        <div className="product-listing-block">
          <h3>Full description</h3>
          <div className="description-editor">
            <textarea defaultValue="Type the complete product description here, including features, care instructions, warranty notes, and customer-facing product details." />
            <div className="description-upload">
              <strong>Upload description images</strong>
              <span>Optional JPG/PNG gallery for rich product details</span>
              <button type="button">Choose images</button>
            </div>
          </div>
        </div>

        <div className="seller-form-actions">
          {sku && <span className="sku-preview">Generated SKU: {sku}</span>}
          <button type="button" className="seller-primary-action" onClick={handleProductInfoSave}>
            Save to DB & Generate SKU
          </button>
        </div>
      </section>

      <section className="seller-console-grid">
        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Image and video upload</h2>
              <p>Five product images are mandatory. Product video is optional.</p>
            </div>
            <span className="seller-badge seller-badge--success">5/5 images ready</span>
          </div>
          <div className="listing-media-grid">
            {uploadTiles.map((tile) => (
              <div key={tile.label} className="listing-media-card">
                <strong>{tile.label}</strong>
                <span>Mandatory</span>
                <div className="kyc-progress"><span style={{ width: `${tile.progress}%` }} /></div>
                <em>{tile.progress}% uploaded</em>
              </div>
            ))}
            <div className="listing-media-card listing-media-card--optional">
              <strong>Video</strong>
              <span>Optional</span>
              <button type="button">Upload video</button>
            </div>
          </div>
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Listing status</h2>
              <p>Product is not public until admin approval.</p>
            </div>
          </div>
          <div className="seller-status-list">
            <div><strong>SKU</strong><span>{sku || 'Not generated'}</span></div>
            <div><strong>HSN</strong><span>{hsnCode}</span></div>
            <div><strong>Approval</strong><span>{workflow.productApprovalStatus}</span></div>
          </div>
        </article>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Variant section</h2>
            <p>Each non-free-size variant gets a unique variant ID. Free Size uses the default variant ID.</p>
          </div>
          <button type="button">Add variant</button>
        </div>

        <form className="seller-console-form">
          <label>
            Size variant
            <select value={sizeMode} onChange={(event) => setSizeMode(event.target.value)}>
              <option>Free Size</option>
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
            </select>
          </label>
          <label>
            Colour variant
            <select value={colorMode} onChange={(event) => setColorMode(event.target.value)}>
              <option>Black</option>
              <option>Blue</option>
              <option>White</option>
              <option>Gold</option>
            </select>
          </label>
        </form>

        <div className="variant-table">
          <div className="variant-table__row variant-table__row--head">
            <span>Variant ID</span><span>Size</span><span>Colour</span><span>MRP</span><span>Selling price</span><span>Stock</span><span>Image</span>
          </div>
          {variantRows.map((variant, index) => (
            <div className="variant-table__row" key={`${variant.size}-${variant.color}`}>
              <span>{createVariantId(variant.size, variant.color, index)}</span>
              <span>{variant.size}</span>
              <span>{variant.color}</span>
              <input defaultValue={variant.mrp} />
              <input defaultValue={variant.selling} />
              <input defaultValue={variant.stock} />
              <button type="button">Optional upload</button>
            </div>
          ))}
        </div>
      </section>

      <section className="seller-console-grid">
        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Package measurement</h2>
              <p>Used for shipping rate and logistics validation.</p>
            </div>
          </div>
          <form className="seller-console-form">
            <label>
              Type of packing
              <select defaultValue="Box">
                <option>Box</option>
                <option>Poly mailer</option>
                <option>Tube</option>
                <option>Crate</option>
              </select>
            </label>
            <label>Total weight (kg)<input defaultValue="0.85" /></label>
            <label>Package length (cm)<input defaultValue="24" /></label>
            <label>Package width (cm)<input defaultValue="18" /></label>
            <label>Package height (cm)<input defaultValue="9" /></label>
          </form>
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Manufacturer details</h2>
              <p>Origin country is auto-set from seller country.</p>
            </div>
          </div>
          <form className="seller-console-form seller-console-form--single">
            <label>Manufacturer name<input defaultValue="AGTRENZ Manufacturing Partner" /></label>
            <label>
              Manufacturer country
              <select defaultValue="India">
                <option>India</option>
                <option>United Arab Emirates</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>China</option>
              </select>
            </label>
            <label>Origin country<input defaultValue="India" readOnly /></label>
            <label>Usage note (optional)<textarea placeholder="Add usage notes if applicable" /></label>
            <label>Ingredients (optional)<textarea placeholder="Required only for applicable categories" /></label>
          </form>
        </article>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Final save</h2>
            <p>Save package, manufacturer, media, and variant data to DB before sending for approval.</p>
          </div>
        </div>
        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}
        <button type="button" className="seller-primary-action" onClick={handleSubmitProduct}>
          Save to DB & Submit for Admin Approval
        </button>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Product catalogue</h2>
            <p>Listings are published only after admin approval.</p>
          </div>
        </div>
        {workflow.productApprovalStatus !== 'none' ? (
          <div className="seller-table">
            <div className="seller-table__row seller-table__row--head"><span>Product</span><span>SKU</span><span>Stock</span><span>Status</span></div>
            <div className="seller-table__row"><span>{workflow.productName}</span><span>—</span><span>—</span><strong>{workflow.productApprovalStatus}</strong></div>
          </div>
        ) : (
          <PanelEmptyState
            title="No products in catalogue"
            message="Create and submit a listing for admin approval to appear here."
          />
        )}
      </section>
    </SellerDashboardShell>
  )
}
