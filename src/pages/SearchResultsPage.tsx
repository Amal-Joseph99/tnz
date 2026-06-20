import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { appendSearchHistory } from '../lib/searchHistory'
import { searchStorefrontProducts } from '../lib/storefrontCatalog'
import type { Product } from '../data/products'

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadResults() {
      setLoading(true)

      if (!query) {
        if (active) {
          setProducts([])
          setLoading(false)
        }
        return
      }

      await appendSearchHistory({
        searchInput: query,
        productName: query,
      })

      const results = await searchStorefrontProducts(query)
      if (active) {
        setProducts(results)
        setLoading(false)
      }
    }

    void loadResults()

    return () => {
      active = false
    }
  }, [query])

  const handleProductOpen = (product: Product) => {
    void appendSearchHistory({
      searchInput: query || product.title,
      productId: Number(product.id),
      productName: product.title,
    })
  }

  return (
    <section className="page-shell">
      <div className="container">
        <header className="page-shell__header page-shell__header--center">
          <h1>Search results</h1>
          {query ? <p>Showing matches for &ldquo;{query}&rdquo;</p> : <p>Enter a search term from the header.</p>}
        </header>

        {loading ? (
          <p className="auth-gate-loading">Searching products...</p>
        ) : products.length === 0 ? (
          <PanelEmptyState
            title={query ? 'No products found' : 'Start searching'}
            message={query ? 'Try a different product name or brand.' : 'Use the search box to find products.'}
          />
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={() => handleProductOpen(product)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
