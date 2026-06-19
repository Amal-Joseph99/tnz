import { trendingProducts } from '../data/products'
import { PanelEmptyState } from './PanelEmptyState'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'

export function TrendingNow() {
  return (
    <section className="products-section">
      <div className="container">
        <SectionHeader title="Trending Now" linkText="See More" />
        {trendingProducts.length > 0 ? (
          <div className="products-grid">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <PanelEmptyState
            title="No trending products yet"
            message="Trending items will show once sellers publish listings."
          />
        )}
      </div>
    </section>
  )
}
