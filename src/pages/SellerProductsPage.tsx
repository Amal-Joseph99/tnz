import { useEffect, useMemo, useState } from 'react'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import {
  buildCategoryTree,
  fetchCategoryTaxonomy,
  getHsnFromTree,
  type CategoryTree,
} from '../lib/catalogCategories'
import { sortCategoryNames } from '../lib/categoryDisplay'
import {
  createSku,
  createVariantId,
  fetchSellerProductCatalogue,
  parseMoneyInput,
  saveSellerProductListing,
  type ProductMediaInput,
  type ProductSpecificationInput,
  type ProductVariantInput,
  type SellerProductCatalogueRow,
} from '../lib/sellerProducts'
import { uploadProductMediaFile } from '../lib/sellerStorage'
import { fetchSellerAccountProfile } from '../lib/sellerKyc'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

type SpecRow = { attributeName: string; attributeValue: string }
type VariantRow = {
  size: string
  color: string
  mrp: string
  selling: string
  stock: string
  imageStoragePath?: string
  imageFileName?: string
}

const defaultSpecs: SpecRow[] = [
  { attributeName: 'Material', attributeValue: 'ABS plastic and memory foam' },
  { attributeName: 'Warranty', attributeValue: '1 year manufacturer warranty' },
  { attributeName: 'Model', attributeValue: 'AGT-AUDIO-2401' },
  { attributeName: 'Compatibility', attributeValue: 'Android, iOS, Windows' },
]

const imageSlots = [1, 2, 3, 4, 5]

export function SellerProductsPage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [catalogue, setCatalogue] = useState<SellerProductCatalogueRow[]>([])
  const [categoryTree, setCategoryTree] = useState<CategoryTree>({})
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [productId, setProductId] = useState<number | undefined>()
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [productType, setProductType] = useState('')
  const [brandName, setBrandName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [specs, setSpecs] = useState<SpecRow[]>(defaultSpecs)
  const [sku, setSku] = useState('')
  const [sizeMode, setSizeMode] = useState('Free Size')
  const [colorMode, setColorMode] = useState('Black')
  const [variantRows, setVariantRows] = useState<VariantRow[]>([
    { size: 'Free Size', color: 'Black', mrp: '149.00', selling: '128.40', stock: '42' },
  ])
  const [packingType, setPackingType] = useState('Box')
  const [weightKg, setWeightKg] = useState('0.85')
  const [packageLengthCm, setPackageLengthCm] = useState('24')
  const [packageWidthCm, setPackageWidthCm] = useState('18')
  const [packageHeightCm, setPackageHeightCm] = useState('9')
  const [manufacturerName, setManufacturerName] = useState('AGTRENZ Manufacturing Partner')
  const [manufacturerCountry, setManufacturerCountry] = useState('India')
  const [originCountry, setOriginCountry] = useState('India')
  const [usageNote, setUsageNote] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [productImages, setProductImages] = useState<Record<number, ProductMediaInput>>({})
  const [descriptionImages, setDescriptionImages] = useState<ProductMediaInput[]>([])
  const [productVideo, setProductVideo] = useState<ProductMediaInput | null>(null)
  const [imageProgress, setImageProgress] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refreshWorkflow = async () => {
    const [workflowState, rows] = await Promise.all([
      fetchSellerWorkflow(),
      fetchSellerProductCatalogue(),
    ])
    setWorkflow(workflowState)
    setCatalogue(rows)
  }

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchSellerProductCatalogue(),
      fetchCategoryTaxonomy(),
      fetchSellerAccountProfile(),
    ])
      .then(([workflowState, rows, taxonomyRows, accountProfile]) => {
        if (!active) return

        setWorkflow(workflowState)
        setCatalogue(rows)
        if (accountProfile) {
          setOriginCountry(accountProfile.countryName)
        }

        const tree = buildCategoryTree(taxonomyRows)
        setCategoryTree(tree)

        const firstCategory = sortCategoryNames(Object.keys(tree))[0]
        if (firstCategory) {
          const firstSubCategory = Object.keys(tree[firstCategory])[0]
          const firstProductType = tree[firstCategory][firstSubCategory]?.productTypes[0] ?? ''
          setCategory(firstCategory)
          setSubCategory(firstSubCategory)
          setProductType(firstProductType)
        }
      })
      .finally(() => {
        if (active) setLoadingCategories(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categoryNames = useMemo(() => sortCategoryNames(Object.keys(categoryTree)), [categoryTree])
  const subCategories = useMemo(
    () => (category ? Object.keys(categoryTree[category] ?? {}) : []),
    [category, categoryTree],
  )
  const productTypes = useMemo(
    () => (category && subCategory ? categoryTree[category]?.[subCategory]?.productTypes ?? [] : []),
    [category, subCategory, categoryTree],
  )
  const hsnCode = getHsnFromTree(categoryTree, category, subCategory, productType)
  const uploadedImageCount = imageSlots.filter((slot) => productImages[slot]).length

  const buildListingPayload = (submitForApproval: boolean) => {
    const specifications: ProductSpecificationInput[] = specs
      .filter((row) => row.attributeName.trim() && row.attributeValue.trim())
      .map((row, index) => ({
        attributeName: row.attributeName.trim(),
        attributeValue: row.attributeValue.trim(),
        sortOrder: index,
      }))

    const variants: ProductVariantInput[] = variantRows.map((row, index) => ({
      variantId: createVariantId(row.size, row.color, index),
      size: row.size,
      color: row.color,
      mrp: parseMoneyInput(row.mrp),
      sellingPrice: parseMoneyInput(row.selling),
      stock: Number.parseInt(row.stock, 10) || 0,
      imageStoragePath: row.imageStoragePath,
      sortOrder: index,
    }))

    const media: ProductMediaInput[] = [
      ...Object.entries(productImages).map(([slot, item]) => ({
        ...item,
        slotIndex: Number(slot),
      })),
      ...descriptionImages,
      ...(productVideo ? [productVideo] : []),
    ]

    return {
      productId,
      sku,
      productName: productName.trim(),
      categoryName: category,
      subCategoryName: subCategory,
      productTypeName: productType,
      hsnCode,
      brandName: brandName.trim(),
      shortDescription,
      fullDescription,
      packingType,
      weightKg: Number.parseFloat(weightKg) || 0,
      packageLengthCm: Number.parseFloat(packageLengthCm) || 0,
      packageWidthCm: Number.parseFloat(packageWidthCm) || 0,
      packageHeightCm: Number.parseFloat(packageHeightCm) || 0,
      manufacturerName,
      manufacturerCountry,
      originCountry,
      usageNote,
      ingredients,
      specifications,
      variants,
      media,
      submitForApproval,
    }
  }

  const handleProductInfoSave = async () => {
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

    const generatedSku = sku || createSku(productName)
    setSku(generatedSku)
    setSaving(true)

    const result = await saveSellerProductListing({
      ...buildListingPayload(false),
      sku: generatedSku,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setProductId(result.productId)
    setMessage(`Product information saved to DB. SKU generated: ${generatedSku}.`)
    await refreshWorkflow()
  }

  const handleSubmitProduct = async () => {
    setError('')
    setMessage('')

    if (!sku) {
      setError('Save product information first to generate SKU.')
      return
    }

    if (uploadedImageCount < 5) {
      setError('Five product images are mandatory before submission.')
      return
    }

    setSaving(true)
    const result = await saveSellerProductListing(buildListingPayload(true))
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setProductId(result.productId)
    setMessage('Product listing saved and submitted for admin approval. It will not be public until admin approves it.')
    await refreshWorkflow()
  }

  const handleVariantSelectorsChange = (nextSize: string, nextColor: string) => {
    setSizeMode(nextSize)
    setColorMode(nextColor)
    setVariantRows([
      { size: nextSize, color: nextColor, mrp: '149.00', selling: '128.40', stock: '42' },
      ...(nextSize === 'Free Size'
        ? []
        : [{ size: 'L', color: 'Blue', mrp: '159.00', selling: '139.00', stock: '24' }]),
    ])
  }

  const handleProductImageUpload = async (slot: number, file: File) => {
    setImageProgress((current) => ({ ...current, [slot]: 40 }))
    const upload = await uploadProductMediaFile(productId ?? null, `product_image_${slot}`, file)
    if (!upload.ok) {
      setImageProgress((current) => ({ ...current, [slot]: 0 }))
      setError(upload.message)
      return
    }

    setProductImages((current) => ({
      ...current,
      [slot]: {
        mediaType: 'product_image',
        storagePath: upload.storagePath,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        slotIndex: slot,
        sortOrder: slot,
      },
    }))
    setImageProgress((current) => ({ ...current, [slot]: 100 }))
  }

  if (!workflow) {
    return (
      <SellerDashboardShell title="Products" subtitle="Create listings, manage pricing, stock, and marketplace visibility.">
        <p>Loading products...</p>
      </SellerDashboardShell>
    )
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
          <label className="seller-console-form__full">Short description<textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder="Short product summary" maxLength={250} /></label>
        </form>

        <div className="product-listing-block">
          <h3>Specifications</h3>
          <div className="spec-table">
            <div className="spec-table__row spec-table__row--head"><span>Attribute</span><span>Value</span></div>
            {specs.map((row, index) => (
              <div className="spec-table__row" key={`spec-${index}`}>
                <input value={row.attributeName} onChange={(event) => setSpecs((current) => current.map((item, i) => i === index ? { ...item, attributeName: event.target.value } : item))} />
                <input value={row.attributeValue} onChange={(event) => setSpecs((current) => current.map((item, i) => i === index ? { ...item, attributeValue: event.target.value } : item))} />
              </div>
            ))}
          </div>
          <button type="button" className="seller-secondary-action" onClick={() => setSpecs((current) => [...current, { attributeName: '', attributeValue: '' }])}>
            Add specification row
          </button>
        </div>

        <div className="product-listing-block">
          <h3>Full description</h3>
          <div className="description-editor">
            <textarea value={fullDescription} onChange={(event) => setFullDescription(event.target.value)} placeholder="Type the complete product description here, including features, care instructions, warranty notes, and customer-facing product details." />
            <div className="description-upload">
              <strong>Upload description images</strong>
              <span>Optional JPG/PNG gallery for rich product details</span>
              <label className="seller-secondary-action">
                Choose images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    void Promise.all(files.map(async (file, index) => {
                      const upload = await uploadProductMediaFile(productId ?? null, 'description_image', file)
                      if (!upload.ok) {
                        setError(upload.message)
                        return
                      }
                      setDescriptionImages((current) => [
                        ...current,
                        {
                          mediaType: 'description_image',
                          storagePath: upload.storagePath,
                          fileName: upload.fileName,
                          mimeType: upload.mimeType,
                          sortOrder: current.length + index,
                        },
                      ])
                    }))
                  }}
                />
              </label>
              {descriptionImages.length > 0 && <p>{descriptionImages.length} description image(s) uploaded</p>}
            </div>
          </div>
        </div>

        <div className="seller-form-actions">
          {sku && <span className="sku-preview">Generated SKU: {sku}</span>}
          <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleProductInfoSave()}>
            {saving ? 'Saving...' : 'Save to DB & Generate SKU'}
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
            <span className="seller-badge seller-badge--success">{uploadedImageCount}/5 images ready</span>
          </div>
          <div className="listing-media-grid">
            {imageSlots.map((slot) => (
              <div key={slot} className="listing-media-card">
                <strong>Image {slot}</strong>
                <span>Mandatory</span>
                <p>{productImages[slot]?.fileName || 'No file selected'}</p>
                <div className="kyc-progress"><span style={{ width: `${imageProgress[slot] ?? (productImages[slot] ? 100 : 0)}%` }} /></div>
                <em>{imageProgress[slot] ?? (productImages[slot] ? 100 : 0)}% uploaded</em>
                <label className="seller-secondary-action">
                  Upload
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handleProductImageUpload(slot, file)
                  }} />
                </label>
              </div>
            ))}
            <div className="listing-media-card listing-media-card--optional">
              <strong>Video</strong>
              <span>Optional</span>
              <p>{productVideo?.fileName || 'No video selected'}</p>
              <label className="seller-secondary-action">
                Upload video
                <input type="file" accept="video/mp4,video/webm" hidden onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void uploadProductMediaFile(productId ?? null, 'product_video', file).then((upload) => {
                    if (!upload.ok) {
                      setError(upload.message)
                      return
                    }
                    setProductVideo({
                      mediaType: 'product_video',
                      storagePath: upload.storagePath,
                      fileName: upload.fileName,
                      mimeType: upload.mimeType,
                      sortOrder: 99,
                    })
                  })
                }} />
              </label>
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
          <button type="button" onClick={() => setVariantRows((current) => [...current, { size: 'M', color: 'White', mrp: '149.00', selling: '129.00', stock: '10' }])}>
            Add variant
          </button>
        </div>

        <form className="seller-console-form">
          <label>
            Size variant
            <select value={sizeMode} onChange={(event) => handleVariantSelectorsChange(event.target.value, colorMode)}>
              <option>Free Size</option>
              <option>S</option>
              <option>M</option>
              <option>L</option>
              <option>XL</option>
            </select>
          </label>
          <label>
            Colour variant
            <select value={colorMode} onChange={(event) => handleVariantSelectorsChange(sizeMode, event.target.value)}>
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
            <div className="variant-table__row" key={`${variant.size}-${variant.color}-${index}`}>
              <span>{createVariantId(variant.size, variant.color, index)}</span>
              <span>{variant.size}</span>
              <span>{variant.color}</span>
              <input value={variant.mrp} onChange={(event) => setVariantRows((current) => current.map((row, i) => i === index ? { ...row, mrp: event.target.value } : row))} />
              <input value={variant.selling} onChange={(event) => setVariantRows((current) => current.map((row, i) => i === index ? { ...row, selling: event.target.value } : row))} />
              <input value={variant.stock} onChange={(event) => setVariantRows((current) => current.map((row, i) => i === index ? { ...row, stock: event.target.value } : row))} />
              <label>
                Optional upload
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void uploadProductMediaFile(productId ?? null, `variant_${index}`, file).then((upload) => {
                    if (!upload.ok) {
                      setError(upload.message)
                      return
                    }
                    setVariantRows((current) => current.map((row, i) => i === index ? {
                      ...row,
                      imageStoragePath: upload.storagePath,
                      imageFileName: upload.fileName,
                    } : row))
                  })
                }} />
              </label>
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
              <select value={packingType} onChange={(event) => setPackingType(event.target.value)}>
                <option>Box</option>
                <option>Poly mailer</option>
                <option>Tube</option>
                <option>Crate</option>
              </select>
            </label>
            <label>Total weight (kg)<input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} /></label>
            <label>Package length (cm)<input value={packageLengthCm} onChange={(event) => setPackageLengthCm(event.target.value)} /></label>
            <label>Package width (cm)<input value={packageWidthCm} onChange={(event) => setPackageWidthCm(event.target.value)} /></label>
            <label>Package height (cm)<input value={packageHeightCm} onChange={(event) => setPackageHeightCm(event.target.value)} /></label>
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
            <label>Manufacturer name<input value={manufacturerName} onChange={(event) => setManufacturerName(event.target.value)} /></label>
            <label>
              Manufacturer country
              <select value={manufacturerCountry} onChange={(event) => setManufacturerCountry(event.target.value)}>
                <option>India</option>
                <option>United Arab Emirates</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>China</option>
              </select>
            </label>
            <label>Origin country<input value={originCountry} readOnly /></label>
            <label>Usage note (optional)<textarea value={usageNote} onChange={(event) => setUsageNote(event.target.value)} placeholder="Add usage notes if applicable" /></label>
            <label>Ingredients (optional)<textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} placeholder="Required only for applicable categories" /></label>
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
        <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleSubmitProduct()}>
          {saving ? 'Submitting...' : 'Save to DB & Submit for Admin Approval'}
        </button>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Product catalogue</h2>
            <p>Listings are published only after admin approval.</p>
          </div>
        </div>
        {catalogue.length > 0 ? (
          <div className="seller-table">
            <div className="seller-table__row seller-table__row--head"><span>Product</span><span>SKU</span><span>Stock</span><span>Status</span></div>
            {catalogue.map((row) => (
              <div className="seller-table__row" key={row.id}>
                <span>{row.productName}</span>
                <span>{row.sku}</span>
                <span>{row.stock}</span>
                <strong>{row.approvalStatus}</strong>
              </div>
            ))}
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
