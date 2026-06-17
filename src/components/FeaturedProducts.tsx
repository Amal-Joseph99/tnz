import { featuredProducts } from '../data/products'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'

export function FeaturedProducts() {
  return (
    <section className="products-section">
      <div className="container">
        <SectionHeader title="Featured Products" badge="SPONSORED" />
        <div className="products-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
