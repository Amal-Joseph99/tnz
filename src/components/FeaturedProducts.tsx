import { useEffect, useState } from 'react'
import { PanelEmptyState } from './PanelEmptyState'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'
import { fetchHighlightSectionProducts } from '../lib/storefrontHighlights'
import type { Product } from '../data/products'

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchHighlightSectionProducts('featured')
      .then((rows) => {
        if (active) setProducts(rows)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="products-section">
      <div className="container">
        <SectionHeader title="Featured Products" badge="SPONSORED" />
        {loading ? (
          <p>Loading featured products...</p>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
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
