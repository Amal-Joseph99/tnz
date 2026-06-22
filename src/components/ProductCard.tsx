import { useEffect, useState } from 'react'
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
  const { requestAddToCart } = useAddToCart()
  const [imageSrc, setImageSrc] = useState(product.image || PRODUCT_PLACEHOLDER)

  useEffect(() => {
    setImageSrc(product.image || PRODUCT_PLACEHOLDER)
  }, [product.image])

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
            type="button"
            className="product-card__cart-btn"
            onClick={() => void requestAddToCart()}
          >
            <CartIcon />
            <span className="product-card__cart-label">Add to Cart</span>
          </button>
        </div>
      </div>
    </article>
  )
}
