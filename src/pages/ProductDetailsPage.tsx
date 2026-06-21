import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CartIcon, StarIcon } from '../components/Icons'
import { PageMeta } from '../components/PageMeta'
import { ProductReviewsSection } from '../components/ProductReviewsSection'
import { useCurrency } from '../context/CurrencyContext'
import { useAddToCart } from '../hooks/useAddToCart'
import { useCheckout } from '../context/CheckoutContext'
import {
  aboutProductBullets,
  formatPackageDimensions,
  formatPackageWeight,
  formatReturnReasons,
  formatYesNo,
  optionLabel,
  parseBulletArray,
  readDangerousGoodsFlags,
  usageText,
} from '../lib/productListingDisplay'
import { shareProduct } from '../lib/productShare'
import { appendSearchHistory } from '../lib/searchHistory'
import { absoluteUrl } from '../lib/site'
import { ogImageUrl } from '../lib/sharePages'
import { buildCategoryBrowsePath, fetchStorefrontProductById } from '../lib/storefrontCatalog'
import type { Product } from '../data/products'

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

function DetailTable({ rows }: { rows: Array<[string, string]> }) {
  const visibleRows = rows.filter(([, value]) => value && value !== '—')
  if (visibleRows.length === 0) return null

  return (
    <div className="product-detail__table">
      {visibleRows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function BulletPanel({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <article className="product-detail__panel">
      <h2>{title}</h2>
      <ul className="product-detail__bullets">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  )
}

function TextPanel({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null

  return (
    <article className="product-detail__panel">
      <h2>{title}</h2>
      <p className="product-detail__body-text">{text}</p>
    </article>
  )
}

export function ProductDetailsPage() {
  const { productId } = useParams()
  const { formatPrice } = useCurrency()
  const { requestAddToCart } = useAddToCart()
  const { addItem } = useCheckout()
  const [product, setProduct] = useState<Product | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchStorefrontProductById>>>(null)
  const [loading, setLoading] = useState(true)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState({ reviewCount: 0, averageRating: 0 })
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    let active = true
    const numericId = Number(productId)

    if (!Number.isFinite(numericId)) {
      setLoading(false)
      return
    }

    fetchStorefrontProductById(numericId)
      .then((result) => {
        if (!active) return
        if (result) {
          setProduct(result.card)
          setDetail(result)
          const firstVariant = result.detail.variants[0]
          setSelectedSize(firstVariant?.size ?? '')
          setSelectedColor(firstVariant?.color ?? '')
          void appendSearchHistory({
            searchInput: result.card.title,
            productId: numericId,
            productName: result.card.title,
          })
        } else {
          setProduct(null)
          setDetail(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  const selectedVariant = useMemo(() => {
    if (!detail) return null
    return (
      detail.detail.variants.find((variant) => variant.size === selectedSize && variant.color === selectedColor)
      ?? detail.detail.variants[0]
      ?? null
    )
  }, [detail, selectedColor, selectedSize])

  const sizeVariants = useMemo(
    () => [...new Set(detail?.detail.variants.map((variant) => variant.size) ?? [])],
    [detail],
  )
  const colourVariants = useMemo(
    () => [...new Set(detail?.detail.variants.map((variant) => variant.color) ?? [])],
    [detail],
  )

  const galleryImages = useMemo(() => {
    if (!detail) return [PRODUCT_PLACEHOLDER]
    const images = detail.detail.media
      .filter((item) => item.mediaType === 'product_image' || item.mediaType === 'description_image')
      .map((item) => item.url)

    if (selectedVariant?.image_storage_path) {
      const variantImage = detail.detail.media.find((item) => item.storagePath === selectedVariant.image_storage_path)
      if (variantImage) {
        return [variantImage.url, ...images.filter((url) => url !== variantImage.url)]
      }
    }

    return images.length > 0 ? images : [product?.image ?? PRODUCT_PLACEHOLDER]
  }, [detail, product?.image, selectedVariant?.image_storage_path])

  const galleryVideos = useMemo(
    () => detail?.detail.media.filter((item) => item.mediaType === 'product_video') ?? [],
    [detail],
  )

  if (loading) {
    return (
      <section className="product-detail-page">
        <div className="container"><p>Loading product...</p></div>
      </section>
    )
  }

  if (!product || !detail) {
    return <Navigate to="/categories" replace />
  }

  const productRow = detail.detail
  const options = detail.listingOptions
  const productDescription = productRow.short_description || `${product.title} by ${product.brand}. Shop on AGTRENZ.`
  const productImage = ogImageUrl(galleryImages[activeImageIndex] ?? product.image)
  const aboutBullets = aboutProductBullets(productRow)
  const packageContents = parseBulletArray(productRow.package_contents_bullets)
  const usage = usageText(productRow)
  const dangerousGoods = readDangerousGoodsFlags(productRow)
  const displayPrice = selectedVariant?.selling_price ?? product.price
  const displayMrp = selectedVariant?.mrp ?? product.originalPrice ?? product.price
  const hasDiscount = displayMrp > displayPrice && displayPrice > 0
  const discountPercent = hasDiscount
    ? `${Math.round(((displayMrp - displayPrice) / displayMrp) * 100)}% off`
    : undefined
  const variantStock = selectedVariant?.stock ?? 0
  const stockLabel = variantStock > 0 ? 'In Stock' : 'Out of Stock'

  const specifications: Array<[string, string]> = [
    ['Brand', product.brand],
    ['Category', productRow.category_name],
    ['Sub Category', productRow.sub_category_name],
    ['Product Type', productRow.product_type_name],
    ...productRow.specifications.map((spec) => [spec.attribute_name, spec.attribute_value] as [string, string]),
  ]

  const itemDetails: Array<[string, string]> = [
    ['SKU', productRow.sku],
    ['HSN', productRow.hsn_code],
    ['Item condition', optionLabel(options.itemConditions, productRow.item_condition_code ?? '')],
    ['Manufacturer', productRow.manufacturer_name ?? '—'],
    ['Manufacturer country', productRow.manufacturer_country ?? '—'],
    ['Origin country', productRow.origin_country ?? '—'],
    ['Package dimensions', formatPackageDimensions(productRow, options)],
    ['Package weight', formatPackageWeight(productRow, options)],
    ['Stock', stockLabel],
  ]

  const complianceRows: Array<[string, string]> = [
    ['Warranty available', formatYesNo(Boolean(productRow.warranty_available))],
    ...(productRow.warranty_available
      ? ([
          ['Warranty period', optionLabel(options.warrantyPeriods, productRow.warranty_period_code ?? '')],
          ['Warranty type', productRow.warranty_type ?? '—'],
        ] as Array<[string, string]>)
      : []),
    ['Return eligible', formatYesNo(Boolean(productRow.return_eligible))],
    ...(productRow.return_eligible
      ? ([
          ['Return window', optionLabel(options.returnWindows, productRow.return_window_code ?? '')],
          ['Return reasons', formatReturnReasons(productRow.return_reason_codes, options)],
        ] as Array<[string, string]>)
      : []),
    ...dangerousGoods.map((field) => [field.label, 'Yes'] as [string, string]),
  ]

  const handleShare = async () => {
    try {
      const result = await shareProduct(product)
      if (result === 'copied') {
        setShareMessage('Share link copied with image preview.')
      } else if (result === 'shared') {
        setShareMessage('Product shared.')
      } else {
        setShareMessage(null)
      }
    } catch {
      setShareMessage('Unable to share this product right now.')
    }
  }

  return (
    <section className="product-detail-page">
      <PageMeta
        title={`${product.title} | AGTRENZ`}
        description={productDescription}
        image={productImage}
        url={absoluteUrl(`/product/${product.id}`)}
        type="product"
      />
      <div className="container product-detail">
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={buildCategoryBrowsePath(productRow.category_name)}>{productRow.category_name}</Link>
          <span>/</span>
          <Link to={buildCategoryBrowsePath(productRow.category_name, productRow.sub_category_name)}>
            {productRow.sub_category_name}
          </Link>
          <span>/</span>
          <strong>{productRow.product_type_name}</strong>
        </nav>

        <div className="product-detail__hero">
          <section className="product-detail__gallery">
            <div className="product-detail__main-image">
              <img src={galleryImages[activeImageIndex] ?? galleryImages[0]} alt={product.title} />
            </div>
            <div className="product-detail__thumbs">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  className={index === activeImageIndex ? 'product-detail__thumb product-detail__thumb--active' : 'product-detail__thumb'}
                  key={`${product.id}-image-${index + 1}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={image} alt={`${product.title} thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
            {galleryVideos.length > 0 && (
              <div className="product-detail__videos">
                {galleryVideos.map((video) => (
                  <video
                    key={video.storagePath}
                    className="product-detail__video"
                    src={video.url}
                    controls
                    preload="metadata"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="product-detail__summary">
            <h1>{product.title}</h1>
            <Link to={`/search?brand=${product.brand}`} className="product-detail__brand">
              {product.brand}
            </Link>
            <p className="product-detail__short">{productDescription}</p>

            {(reviewSummary.reviewCount > 0 || product.reviews > 0) && (
              <div className="product-detail__rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={`rating-${index + 1}`}
                    className={index < Math.round(reviewSummary.averageRating || product.rating) ? 'star filled' : 'star'}
                  />
                ))}
                <span>{reviewSummary.averageRating || product.rating}</span>
                <span>{reviewSummary.reviewCount || product.reviews} reviews</span>
              </div>
            )}

            <div className="product-detail__price-block">
              {hasDiscount && <span>MRP: <s>{formatPrice(displayMrp)}</s></span>}
              {discountPercent && <strong>{discountPercent}</strong>}
              <div>{formatPrice(displayPrice)}</div>
              <small>Inclusive of all taxes</small>
            </div>

            <div className="product-detail__variant-block">
              {sizeVariants.length > 0 && (
                <div className="product-detail__option-row">
                  <span>Size</span>
                  {sizeVariants.map((size) => (
                    <button
                      type="button"
                      className={size === selectedSize ? 'product-detail__chip product-detail__chip--active' : 'product-detail__chip'}
                      key={size}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
              {colourVariants.length > 0 && (
                <div className="product-detail__option-row">
                  <span>Colour</span>
                  {colourVariants.map((colour) => (
                    <button
                      type="button"
                      className={colour === selectedColor ? 'product-detail__chip product-detail__chip--active' : 'product-detail__chip'}
                      key={colour}
                      onClick={() => setSelectedColor(colour)}
                    >
                      {colour}
                    </button>
                  ))}
                </div>
              )}
              <div className="product-detail__variant-meta">
                <span>Variant ID: {selectedVariant?.variant_id ?? '—'}</span>
                <strong>{stockLabel}</strong>
              </div>
            </div>

            <div className="product-detail__actions">
              <button
                type="button"
                className="product-detail__add"
                disabled={!selectedVariant || variantStock <= 0}
                onClick={() => {
                  void (async () => {
                    const allowed = await requestAddToCart()
                    if (!allowed || !selectedVariant) return

                    addItem({
                      id: String(product.id),
                      productId: Number(product.id),
                      sellerUserId: productRow.user_id,
                      sku: productRow.sku,
                      title: product.title,
                      brand: product.brand,
                      price: selectedVariant.selling_price,
                      originalPrice:
                        selectedVariant.mrp > selectedVariant.selling_price ? selectedVariant.mrp : undefined,
                      image: galleryImages[activeImageIndex] ?? product.image,
                      quantity: 1,
                      variantId: selectedVariant.variant_id,
                    })
                  })()
                }}
              >
                <CartIcon />
                Add to Cart
              </button>
              <button type="button" className="product-detail__buy">Buy Now</button>
              <button type="button" className="product-detail__share" onClick={() => void handleShare()}>
                Share
              </button>
            </div>

            {shareMessage && <p className="product-detail__share-message">{shareMessage}</p>}

            <div className="product-detail__notice">
              <span>Delivery details available at checkout.</span>
              {productRow.return_eligible && (
                <span>
                  Returns accepted within {optionLabel(options.returnWindows, productRow.return_window_code ?? '')}.
                </span>
              )}
            </div>
          </section>
        </div>

        <section className="product-detail__info-grid">
          {(aboutBullets.length > 0 || productRow.full_description) && (
            <article className="product-detail__panel product-detail__about">
              <h2>About Product</h2>
              {aboutBullets.length > 0 ? (
                <ul className="product-detail__bullets">
                  {aboutBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="product-detail__body-text">{productRow.full_description}</p>
              )}
            </article>
          )}

          <article className="product-detail__panel">
            <h2>Specifications</h2>
            <DetailTable rows={specifications} />
          </article>

          <article className="product-detail__panel">
            <h2>Item Details</h2>
            <DetailTable rows={itemDetails} />
          </article>

          <BulletPanel title="Package Contents" items={packageContents} />
          <TextPanel title="Ingredients" text={productRow.ingredients ?? ''} />
          <TextPanel title="Usage Instructions" text={usage} />
          <TextPanel title="Important Note / Warning" text={productRow.important_note ?? ''} />

          {complianceRows.length > 0 && (
            <article className="product-detail__panel">
              <h2>Warranty & Returns</h2>
              <DetailTable rows={complianceRows} />
            </article>
          )}
        </section>

        <ProductReviewsSection
          productId={Number(product.id)}
          onSummaryChange={setReviewSummary}
        />
      </div>
    </section>
  )
}
