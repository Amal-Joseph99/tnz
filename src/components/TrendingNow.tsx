import { trendingProducts } from '../data/products'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'

export function TrendingNow() {
  return (
    <section className="products-section">
      <div className="container">
        <SectionHeader title="Trending Now" linkText="See More" />
        <div className="products-grid">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
