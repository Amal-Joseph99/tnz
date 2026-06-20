import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
import type { Product } from '../data/products'
import { useAddToCart } from '../hooks/useAddToCart'
import { CartIcon, EyeIcon, HeartIcon, StarIcon } from './Icons'

type ProductCardProps = {
  product: Product
  onOpen?: () => void
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const { formatPrice } = useCurrency()
  const { requestAddToCart } = useAddToCart()

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <Link
          to={`/product/${product.id}`}
          className="product-card__image-link"
          onClick={() => onOpen?.()}
        >
          <img src={product.image} alt={product.title} className="product-card__image" />
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
              <span className="product-card__original">{formatPrice(product.originalPrice)}</span>
            )}
            <span className="product-card__price">{formatPrice(product.price)}</span>
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
