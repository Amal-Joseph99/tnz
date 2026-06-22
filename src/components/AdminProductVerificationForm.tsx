import type { ReactNode } from 'react'
import {
  aboutProductBullets,
  DANGEROUS_GOODS_FIELDS,
  formatPackageDimensions,
  formatPackageWeight,
  formatReturnReasons,
  formatYesNo,
  optionLabel,
  parseBulletArray,
  PRODUCT_DECLARATION_ITEMS,
  usageText,
} from '../lib/productListingDisplay'
import type { ProductListingWizardOptions } from '../lib/productListingWizard'
import type { AdminProductDetail, ProductQueueItem } from '../lib/adminApprovals'

type AdminProductVerificationFormProps = {
  item: ProductQueueItem
  detail: AdminProductDetail | null
  options: ProductListingWizardOptions
  mediaUrls: Record<string, string>
  variantImageUrls: Record<string, string>
  loading?: boolean
  onApprove?: () => void
  onReject?: () => void
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="kyc-form-field">
      <span className="kyc-form-field__label">{label}</span>
      <span className="kyc-form-field__value">{value || '—'}</span>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="product-review-empty">—</p>
  }

  return (
    <ul className="product-review-bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="product-review-section">
      <h3 className="product-review-section__title">{title}</h3>
      {children}
    </section>
  )
}

export function AdminProductVerificationForm({
  item,
  detail,
  options,
  mediaUrls,
  variantImageUrls,
  loading = false,
  onApprove,
  onReject,
}: AdminProductVerificationFormProps) {
  const product = detail?.product ?? {}
  const canDecide = item.approvalStatus === 'pending' && onApprove && onReject
  const statusLabel = item.approvalStatus.replaceAll('_', ' ').toUpperCase()
  const aboutBullets = aboutProductBullets(product)
  const packageContents = parseBulletArray(product.package_contents_bullets)
  const dangerousGoods = DANGEROUS_GOODS_FIELDS.filter((field) => Boolean(product[field.key]))
  const imageMedia = (detail?.media ?? []).filter((entry) => entry.mediaType === 'product_image')
  const videoMedia = (detail?.media ?? []).filter((entry) => entry.mediaType === 'product_video')

  return (
    <article className="kyc-verification-form product-verification-form">
      <header className="kyc-verification-form__header">
        <div className="kyc-verification-form__title">
          <h2>{item.productName}</h2>
          <p>SKU {item.sku} · HSN {item.hsnCode}</p>
        </div>
        <div className="kyc-verification-form__meta">
          <div className="kyc-verification-form__meta-left">
            <p>Seller</p>
            <strong>{item.sellerBusinessName}</strong>
            <p>{item.sellerEmail}</p>
          </div>
          <span className={`kyc-verification-form__status kyc-verification-form__status--${item.approvalStatus}`}>
            {statusLabel}
          </span>
        </div>
      </header>

      {loading ? (
        <p className="kyc-verification-form__loading">Loading listing detail...</p>
      ) : !detail ? (
        <p className="kyc-verification-form__loading">Listing detail unavailable.</p>
      ) : (
        <>
          <Section title="1. Product classification">
            <div className="product-review-grid">
              <FormField label="Category" value={item.categoryName} />
              <FormField label="Sub category" value={item.subCategoryName} />
              <FormField label="Product type" value={item.productTypeName} />
              <FormField label="HSN code" value={item.hsnCode} />
              <FormField
                label="Item condition"
                value={optionLabel(options.itemConditions, String(product.item_condition_code ?? ''))}
              />
            </div>
          </Section>

          <Section title="2. Product details">
            <div className="product-review-grid">
              <FormField label="Product name" value={String(product.product_name ?? '')} />
              <FormField label="Brand" value={String(product.brand_name ?? '')} />
            </div>
            <FormField label="Short description" value={String(product.short_description ?? '')} />
            <div className="kyc-form-field">
              <span className="kyc-form-field__label">Full description</span>
              <BulletList items={aboutBullets} />
            </div>
            <div className="spec-table">
              <div className="spec-table__row spec-table__row--head">
                <span>Specification</span>
                <span>Value</span>
              </div>
              {detail.specifications.map((spec, index) => (
                <div className="spec-table__row" key={`${spec.attributeName}-${index}`}>
                  <span>{spec.attributeName}</span>
                  <span>{spec.attributeValue}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. Manufacturer, compliance & safety">
            <div className="product-review-grid">
              <FormField label="Manufacturer name" value={String(product.manufacturer_name ?? '')} />
              <FormField label="Manufacturer country" value={String(product.manufacturer_country ?? '')} />
              <FormField label="Product origin country" value={String(product.origin_country ?? '')} />
            </div>
            <FormField label="Ingredients" value={String(product.ingredients ?? '')} />
            <FormField label="Usage instructions" value={usageText(product)} />
            <FormField label="Important note / warning" value={String(product.important_note ?? '')} />
            <div className="product-review-grid">
              <FormField label="Warranty available" value={formatYesNo(Boolean(product.warranty_available))} />
              {product.warranty_available ? (
                <>
                  <FormField
                    label="Warranty period"
                    value={optionLabel(options.warrantyPeriods, String(product.warranty_period_code ?? ''))}
                  />
                  <FormField label="Warranty type" value={String(product.warranty_type ?? '')} />
                </>
              ) : null}
            </div>
            <div className="kyc-form-field">
              <span className="kyc-form-field__label">Dangerous goods declaration</span>
              <span className="kyc-form-field__value">
                {dangerousGoods.length > 0
                  ? dangerousGoods.map((field) => field.label).join(', ')
                  : 'None declared'}
              </span>
            </div>
            <div className="kyc-form-field">
              <span className="kyc-form-field__label">Package contents</span>
              <BulletList items={packageContents} />
            </div>
          </Section>

          <Section title="4. Images & variants">
            <p className="product-review-meta">
              {imageMedia.length} image(s) · {videoMedia.length} video(s) · {detail.variants.length} variant(s)
            </p>
            {imageMedia.length > 0 ? (
              <div className="admin-product-media-gallery" aria-label="Product images">
                {imageMedia.map((entry, index) => (
                  <div key={entry.storagePath} className="admin-product-media-tile">
                    {mediaUrls[entry.storagePath] ? (
                      <img src={mediaUrls[entry.storagePath]} alt={`Product image ${index + 1}`} loading="lazy" />
                    ) : (
                      <span className="admin-product-media-tile__placeholder" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            {videoMedia.length > 0 ? (
              <div className="admin-product-video-gallery" aria-label="Product videos">
                {videoMedia.map((entry, index) => (
                  <div key={entry.storagePath} className="admin-product-video-tile">
                    {mediaUrls[entry.storagePath] ? (
                      <video src={mediaUrls[entry.storagePath]} controls preload="metadata" />
                    ) : (
                      <span className="admin-product-media-tile__placeholder" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="variant-table">
              <div className="variant-table__row variant-table__row--head">
                <span>Variant ID</span>
                <span>Size</span>
                <span>Colour</span>
                <span>MRP</span>
                <span>Price</span>
                <span>Stock</span>
                <span>Image</span>
              </div>
              {detail.variants.map((variant) => (
                <div className="variant-table__row" key={variant.variantId}>
                  <span>{variant.variantId}</span>
                  <span>{variant.size}</span>
                  <span>{variant.color}</span>
                  <span>{variant.mrp}</span>
                  <span>{variant.sellingPrice}</span>
                  <span>{variant.stock}</span>
                  <span>
                    {variant.imageStoragePath && variantImageUrls[variant.imageStoragePath] ? (
                      <img
                        className="product-review-variant-thumb"
                        src={variantImageUrls[variant.imageStoragePath]}
                        alt={`${variant.variantId} image`}
                      />
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. Package dimensions & return policy">
            <div className="product-review-grid">
              <FormField label="Package dimensions" value={formatPackageDimensions(product, options)} />
              <FormField label="Package weight" value={formatPackageWeight(product, options)} />
              <FormField label="Return eligible" value={formatYesNo(Boolean(product.return_eligible))} />
              {product.return_eligible ? (
                <>
                  <FormField
                    label="Return window"
                    value={optionLabel(options.returnWindows, String(product.return_window_code ?? ''))}
                  />
                  <FormField
                    label="Return reason type"
                    value={formatReturnReasons(product.return_reason_codes, options)}
                  />
                </>
              ) : null}
            </div>
          </Section>

          <Section title="6. Seller declarations">
            <div className="listing-declaration-list product-review-declarations">
              {PRODUCT_DECLARATION_ITEMS.map((entry) => {
                const accepted = Boolean(product[entry.key])
                return (
                  <div
                    key={entry.key}
                    className={`kyc-form-policy${accepted ? ' kyc-form-policy--accepted' : ''}`}
                  >
                    <span className="kyc-form-policy__box" aria-hidden="true">
                      {accepted ? '✓' : ''}
                    </span>
                    <span className="kyc-form-policy__text">{entry.label}</span>
                  </div>
                )
              })}
            </div>
          </Section>
        </>
      )}

      {canDecide && (
        <div className="kyc-verification-form__actions">
          <button type="button" className="admin-accept" onClick={onApprove}>
            Approve listing
          </button>
          <button type="button" className="admin-reject" onClick={onReject}>
            Reject listing
          </button>
        </div>
      )}
    </article>
  )
}
