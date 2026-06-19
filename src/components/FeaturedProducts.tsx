import { featuredProducts } from '../data/products'
import { PanelEmptyState } from './PanelEmptyState'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'

export function FeaturedProducts() {
  return (
    <section className="products-section">
      <div className="container">
        <SectionHeader title="Featured Products" badge="SPONSORED" />
        {featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <PanelEmptyState
            title="No featured products yet"
            message="Published marketplace listings will appear here."
          />
        )}
      </div>
    </section>
  )
}
