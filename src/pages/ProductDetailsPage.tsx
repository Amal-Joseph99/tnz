import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CartIcon, StarIcon } from '../components/Icons'
import { PageMeta } from '../components/PageMeta'
import { ProductReviewsSection } from '../components/ProductReviewsSection'
import { useCurrency } from '../context/CurrencyContext'
import { useAddToCart } from '../hooks/useAddToCart'
import { shareProduct } from '../lib/productShare'
import { appendSearchHistory } from '../lib/searchHistory'
import { absoluteUrl } from '../lib/site'
import { ogImageUrl } from '../lib/sharePages'
import { buildCategoryBrowsePath, fetchStorefrontProductById } from '../lib/storefrontCatalog'
import type { Product } from '../data/products'

export function ProductDetailsPage() {
  const { productId } = useParams()
  const { formatPrice } = useCurrency()
  const { requestAddToCart } = useAddToCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchStorefrontProductById>>>(null)
  const [loading, setLoading] = useState(true)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState({ reviewCount: 0, averageRating: 0 })

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

  const productDescription = detail.detail.short_description
    || `${product.title} by ${product.brand}. Shop on AGTRENZ.`
  const productImage = ogImageUrl(product.image)
  const galleryImages = detail.detail.media.length > 0 ? detail.detail.media : [product.image]
  const sizeVariants = [...new Set(detail.detail.variants.map((variant) => variant.size))]
  const colourVariants = [...new Set(detail.detail.variants.map((variant) => variant.color))]
  const primaryVariant = detail.detail.variants[0]
  const totalStock = detail.detail.variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0)
  const stockLabel = totalStock > 0 ? 'In Stock' : 'Out of Stock'

  const specifications = [
    ['Brand', product.brand],
    ['Category', detail.detail.category_name],
    ['Sub Category', detail.detail.sub_category_name],
    ['Product Type', detail.detail.product_type_name],
    ...detail.detail.specifications.map((spec) => [spec.attribute_name, spec.attribute_value]),
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
          <Link to={buildCategoryBrowsePath(detail.detail.category_name)}>{detail.detail.category_name}</Link>
          <span>/</span>
          <Link to={buildCategoryBrowsePath(detail.detail.category_name, detail.detail.sub_category_name)}>
            {detail.detail.sub_category_name}
          </Link>
          <span>/</span>
          <strong>{detail.detail.product_type_name}</strong>
        </nav>

        <div className="product-detail__hero">
          <section className="product-detail__gallery">
            <div className="product-detail__main-image">
              <img src={galleryImages[0]} alt={product.title} />
            </div>
            <div className="product-detail__thumbs">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  className={index === 0 ? 'product-detail__thumb product-detail__thumb--active' : 'product-detail__thumb'}
                  key={`${product.id}-image-${index + 1}`}
                >
                  <img src={image} alt={`${product.title} thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
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
              {product.originalPrice && <span>MRP: <s>{formatPrice(product.originalPrice)}</s></span>}
              {product.discount && <strong>{product.discount}</strong>}
              <div>{formatPrice(product.price)}</div>
              <small>Inclusive of all taxes</small>
            </div>

            <div className="product-detail__variant-block">
              <div className="product-detail__option-row">
                <span>Size</span>
                {sizeVariants.map((size, index) => (
                  <button type="button" className={index === 0 ? 'product-detail__chip product-detail__chip--active' : 'product-detail__chip'} key={size}>{size}</button>
                ))}
              </div>
              <div className="product-detail__option-row">
                <span>Colour</span>
                {colourVariants.map((colour, index) => (
                  <button
                    type="button"
                    className={index === 0 ? 'product-detail__chip product-detail__chip--active' : 'product-detail__chip'}
                    key={colour}
                  >
                    {colour}
                  </button>
                ))}
              </div>
              <div className="product-detail__variant-meta">
                <span>Variant ID: {primaryVariant?.variant_id ?? '—'}</span>
                <strong>{stockLabel}</strong>
              </div>
            </div>

            <div className="product-detail__actions">
              <button type="button" className="product-detail__add" onClick={() => void requestAddToCart()}>
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
            </div>
          </section>
        </div>

        <section className="product-detail__info-grid">
          <article className="product-detail__panel product-detail__about">
            <h2>About Product</h2>
            <p>{detail.detail.full_description || productDescription}</p>
          </article>

          <article className="product-detail__panel">
            <h2>Specifications</h2>
            <div className="product-detail__table">
              {specifications.map(([label, value], index) => (
                <div key={`${label}-${index}`}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="product-detail__panel">
            <h2>Item Details</h2>
            <div className="product-detail__table">
              <div><span>SKU</span><strong>{detail.detail.sku}</strong></div>
              <div><span>HSN</span><strong>{detail.detail.hsn_code}</strong></div>
              <div><span>Brand</span><strong>{product.brand}</strong></div>
              <div><span>Category</span><strong>{detail.detail.category_name}</strong></div>
              <div><span>Sub Category</span><strong>{detail.detail.sub_category_name}</strong></div>
              <div><span>Product Type</span><strong>{detail.detail.product_type_name}</strong></div>
              <div><span>Stock</span><strong>{stockLabel}</strong></div>
              <div><span>Manufacturer Name</span><strong>{detail.detail.manufacturer_name}</strong></div>
              <div><span>Manufacturer Country</span><strong>{detail.detail.manufacturer_country}</strong></div>
              <div><span>Origin Country</span><strong>{detail.detail.origin_country}</strong></div>
              <div><span>Total Weight</span><strong>{detail.detail.weight_kg} kg</strong></div>
              <div><span>Package</span><strong>{`${detail.detail.package_length_cm} x ${detail.detail.package_width_cm} x ${detail.detail.package_height_cm} cm`}</strong></div>
              <div><span>Type of Packing</span><strong>{detail.detail.packing_type}</strong></div>
              {detail.detail.usage_note && <div><span>Usage Note</span><strong>{detail.detail.usage_note}</strong></div>}
              {detail.detail.ingredients && <div><span>Ingredients</span><strong>{detail.detail.ingredients}</strong></div>}
            </div>
          </article>
        </section>

        <ProductReviewsSection
          productId={Number(product.id)}
          onSummaryChange={setReviewSummary}
        />
      </div>
    </section>
  )
}
