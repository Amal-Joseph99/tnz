import { useEffect, useState } from 'react'
import { PanelEmptyState } from './PanelEmptyState'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'
import { fetchHighlightSectionProducts } from '../lib/storefrontHighlights'
import type { Product } from '../data/products'

export function TrendingNow() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchHighlightSectionProducts('trending')
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
        <SectionHeader title="Trending Now" linkText="See More" />
        {loading ? (
          <p>Loading trending products...</p>
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
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
