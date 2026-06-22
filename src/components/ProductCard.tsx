import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
import type { Product } from '../data/products'
import { useAddToCart } from '../hooks/useAddToCart'
import { CartIcon, EyeIcon, HeartIcon, StarIcon } from './Icons'

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

type ProductCardProps = {
  product: Product
  onOpen?: () => void
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const { formatListingPrice } = useCurrency()
  const { addToCart } = useAddToCart()
  const cartButtonRef = useRef<HTMLButtonElement>(null)
  const images = product.images?.length ? product.images : [product.image || PRODUCT_PLACEHOLDER]
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [imageSrc, setImageSrc] = useState(images[0] ?? PRODUCT_PLACEHOLDER)

  useEffect(() => {
    const nextImages = product.images?.length ? product.images : [product.image || PRODUCT_PLACEHOLDER]
    setActiveImageIndex(0)
    setImageSrc(nextImages[0] ?? PRODUCT_PLACEHOLDER)
  }, [product.id, product.image, product.images])

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <Link
          to={`/product/${product.id}`}
          className="product-card__image-link"
          onClick={() => onOpen?.()}
        >
          <img
            src={imageSrc}
            alt={product.title}
            className="product-card__image"
            onError={() => setImageSrc(PRODUCT_PLACEHOLDER)}
          />
        </Link>
        {images.length > 1 && (
          <div className="product-card__image-thumbs" aria-label={`${product.title} images`}>
            {images.map((image, index) => (
              <button
                key={`${product.id}-thumb-${index + 1}`}
                type="button"
                className={index === activeImageIndex ? 'product-card__image-thumb product-card__image-thumb--active' : 'product-card__image-thumb'}
                aria-label={`Show image ${index + 1}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setActiveImageIndex(index)
                  setImageSrc(image)
                }}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}
        <div className="product-card__badges">
          {product.badge && <span className="product-card__badge">{product.badge}</span>}
          {product.discount && <span className="product-card__discount">{product.discount}</span>}
        </div>
        <div className="product-card__actions">
          <button type="button" className="product-card__icon-btn" aria-label="Add to wishlist">
            <HeartIcon />
          </button>
          <button type="button" className="product-card__icon-btn" aria-label="Quick view">
            <EyeIcon />
          </button>
        </div>
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">{product.brand}</p>
        <h3 className="product-card__title">
          <Link to={`/product/${product.id}`} onClick={() => onOpen?.()}>{product.title}</Link>
        </h3>
        <div className="product-card__rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={i < product.rating ? 'star filled' : 'star'} />
          ))}
          <span className="product-card__reviews">({product.reviews})</span>
        </div>
        <div className="product-card__footer">
          <div className="product-card__prices">
            {product.originalPrice && (
              <span className="product-card__original">
                {formatListingPrice(product.originalPrice, product.listingCurrencyCode)}
              </span>
            )}
            <span className="product-card__price">
              {formatListingPrice(product.price, product.listingCurrencyCode)}
            </span>
          </div>
          <button
            ref={cartButtonRef}
            type="button"
            className="product-card__cart-btn"
            onClick={() => {
              void addToCart({
                item: {
                  id: product.id,
                  productId: Number(product.id),
                  sellerUserId: product.sellerUserId,
                  sku: product.sku,
                  title: product.title,
                  brand: product.brand,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  listingCurrencyCode: product.listingCurrencyCode,
                  image: imageSrc,
                  quantity: 1,
                  variantId: product.variantId,
                },
                source: cartButtonRef.current,
              })
            }}
          >
            <CartIcon />
            <span className="product-card__cart-label">Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  )
}
