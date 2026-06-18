import { Link, Navigate, useParams } from 'react-router-dom'
import { CartIcon, StarIcon } from '../components/Icons'
import { useCurrency } from '../context/CurrencyContext'
import { featuredProducts, trendingProducts } from '../data/products'

const allProducts = [...featuredProducts, ...trendingProducts]

const detailDefaults = {
  category: 'Electronics',
  subCategory: 'Audio',
  productType: 'Wireless Headphones',
  sku: 'AGT-PWH-2401',
  variantId: 'AGT-DEFAULT-VAR',
  sizeVariants: ['Free Size'],
  colourVariants: ['Black', 'Blue', 'White', 'Gold'],
  stock: 'In Stock',
  packingType: 'Box',
  totalWeight: '0.85 kg',
  packageLength: '24 cm',
  packageWidth: '18 cm',
  packageHeight: '9 cm',
  manufacturerName: 'AGTRENZ Manufacturing Partner',
  manufacturerCountry: 'India',
  originCountry: 'India',
  usageNote: 'Use as directed and store in a clean, dry place.',
  ingredients: '--',
}

const specifications = [
  ['Brand', 'AGTRENZ Select'],
  ['Category', detailDefaults.category],
  ['Sub Category', detailDefaults.subCategory],
  ['Product Type', detailDefaults.productType],
  ['Model', 'AGT-AUDIO-2401'],
  ['Compatibility', 'Android, iOS, Windows'],
]

export function ProductDetailsPage() {
  const { productId } = useParams()
  const { formatPrice } = useCurrency()
  const product = allProducts.find((item) => item.id === productId)

  if (!product) {
    return <Navigate to="/" replace />
  }

  const galleryImages = [
    product.image,
    product.image,
    product.image,
    product.image,
    product.image,
  ]

  return (
    <section className="product-detail-page">
      <div className="container product-detail">
        <nav className="product-detail__breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/categories">{detailDefaults.category}</Link>
          <span>/</span>
          <span>{detailDefaults.subCategory}</span>
          <span>/</span>
          <strong>{detailDefaults.productType}</strong>
        </nav>

        <div className="product-detail__hero">
          <section className="product-detail__gallery">
            <div className="product-detail__main-image">
              <img src={product.image} alt={product.title} />
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
              <button type="button" className="product-detail__thumb product-detail__video">Video</button>
            </div>
          </section>

          <section className="product-detail__summary">
            {product.badge && <span className="product-detail__badge">{product.badge}</span>}
            <h1>{product.title}</h1>
            <Link to={`/search?brand=${product.brand}`} className="product-detail__brand">
              {product.brand}
            </Link>
            <p className="product-detail__short">
              {product.title} from {product.brand}. Professional quality product with marketplace-approved listing details.
            </p>

            <div className="product-detail__rating">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon key={`rating-${index + 1}`} className={index < product.rating ? 'star filled' : 'star'} />
              ))}
              <span>{product.rating}.0</span>
              <span>{product.reviews} reviews</span>
            </div>

            <div className="product-detail__price-block">
              {product.originalPrice && <span>MRP: <s>{formatPrice(product.originalPrice)}</s></span>}
              {product.discount && <strong>{product.discount}</strong>}
              <div>{formatPrice(product.price)}</div>
              <small>Inclusive of all taxes</small>
            </div>

            <div className="product-detail__variant-block">
              <div className="product-detail__option-row">
                <span>Size</span>
                {detailDefaults.sizeVariants.map((size) => (
                  <button type="button" className="product-detail__chip product-detail__chip--active" key={size}>{size}</button>
                ))}
              </div>
              <div className="product-detail__option-row">
                <span>Colour</span>
                {detailDefaults.colourVariants.map((colour, index) => (
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
                <span>Variant ID: {detailDefaults.variantId}</span>
                <strong>{detailDefaults.stock}</strong>
              </div>
            </div>

            <div className="product-detail__actions">
              <button type="button" className="product-detail__add">
                <CartIcon />
                Add to Cart
              </button>
              <button type="button" className="product-detail__buy">Buy Now</button>
              <button type="button" className="product-detail__share">Share</button>
            </div>

            <div className="product-detail__notice">
              <span>Delivery details available at checkout.</span>
            </div>
          </section>
        </div>

        <div className="product-detail__tabs" role="tablist" aria-label="Product details">
          <button type="button" className="product-detail__tab product-detail__tab--active">About Product</button>
          <button type="button" className="product-detail__tab">Specifications</button>
          <button type="button" className="product-detail__tab">Reviews</button>
        </div>

        <section className="product-detail__info-grid">
          <article className="product-detail__panel product-detail__about">
            <h2>About Product</h2>
            <ul>
              <li>{product.title} by {product.brand}.</li>
              <li>Short description and full description are based on seller listing inputs.</li>
              <li>Selected variant controls price, stock, and add-to-cart behavior.</li>
            </ul>
          </article>

          <article className="product-detail__panel">
            <h2>Specifications</h2>
            <div className="product-detail__table">
              {specifications.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{label === 'Brand' ? product.brand : value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="product-detail__panel">
            <h2>Item Details</h2>
            <div className="product-detail__table">
              <div><span>SKU</span><strong>{detailDefaults.sku}</strong></div>
              <div><span>Brand</span><strong>{product.brand}</strong></div>
              <div><span>Category</span><strong>{detailDefaults.category}</strong></div>
              <div><span>Sub Category</span><strong>{detailDefaults.subCategory}</strong></div>
              <div><span>Product Type</span><strong>{detailDefaults.productType}</strong></div>
              <div><span>Stock</span><strong>{detailDefaults.stock}</strong></div>
              <div><span>Manufacturer Name</span><strong>{detailDefaults.manufacturerName}</strong></div>
              <div><span>Manufacturer Country</span><strong>{detailDefaults.manufacturerCountry}</strong></div>
              <div><span>Origin Country</span><strong>{detailDefaults.originCountry}</strong></div>
              <div><span>Total Weight</span><strong>{detailDefaults.totalWeight}</strong></div>
              <div><span>Package</span><strong>{`${detailDefaults.packageLength} x ${detailDefaults.packageWidth} x ${detailDefaults.packageHeight}`}</strong></div>
              <div><span>Type of Packing</span><strong>{detailDefaults.packingType}</strong></div>
              <div><span>Usage Note</span><strong>{detailDefaults.usageNote}</strong></div>
              <div><span>Ingredients</span><strong>{detailDefaults.ingredients}</strong></div>
            </div>
          </article>
        </section>

        <section className="product-detail__reviews">
          <h2>Customer reviews</h2>
          <p>No reviews yet. Be the first to review.</p>
          <div className="product-detail__review-stars">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon key={`empty-review-${index + 1}`} className="star" />
            ))}
            <span>0 out of 5</span>
          </div>
        </section>
      </div>
    </section>
  )
}
