import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CategoryIcon } from '../components/Icons'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { ProductCard } from '../components/ProductCard'
import { getCategoryIconName } from '../lib/categoryDisplay'
import {
  buildCategoryBrowsePath,
  fetchStorefrontProductsByCategory,
  fetchSubcategoriesForCategory,
  resolveCategoryNameFromSlug,
  resolveSubcategoryNameFromSlug,
} from '../lib/storefrontCatalog'
import type { Product } from '../data/products'

export function CategoryProductsPage() {
  const { categorySlug, subCategorySlug } = useParams()
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!categorySlug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setNotFound(false)

      const resolvedCategory = await resolveCategoryNameFromSlug(categorySlug)
      if (!resolvedCategory) {
        if (active) {
          setNotFound(true)
          setLoading(false)
        }
        return
      }

      const subs = await fetchSubcategoriesForCategory(resolvedCategory)
      const resolvedSub = await resolveSubcategoryNameFromSlug(resolvedCategory, subCategorySlug)
      const productRows = await fetchStorefrontProductsByCategory(resolvedCategory, resolvedSub)

      if (!active) return

      setCategoryName(resolvedCategory)
      setSubcategories(subs)
      setActiveSubcategory(resolvedSub)
      setProducts(productRows)
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [categorySlug, subCategorySlug])

  if (notFound) {
    return <Navigate to="/categories" replace />
  }

  if (loading || !categoryName) {
    return (
      <section className="category-browse-page">
        <div className="container">
          <p>Loading category...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="category-browse-page">
      <div className="category-browse-topbar">
        <div className="container category-browse-topbar__inner">
          <h1>{categoryName}</h1>
          <nav className="category-browse-subnav" aria-label={`${categoryName} subcategories`}>
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory}
                to={buildCategoryBrowsePath(categoryName, subcategory)}
                className={activeSubcategory === subcategory ? 'is-active' : undefined}
              >
                {subcategory}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="container category-browse-layout">
        <aside className="category-browse-sidebar">
          <h2>Category</h2>
          <Link to={buildCategoryBrowsePath(categoryName)} className={!activeSubcategory ? 'is-active' : undefined}>
            {categoryName}
          </Link>
          <ul>
            {subcategories.map((subcategory) => (
              <li key={subcategory}>
                <Link
                  to={buildCategoryBrowsePath(categoryName, subcategory)}
                  className={activeSubcategory === subcategory ? 'is-active' : undefined}
                >
                  {subcategory}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="category-browse-main">
          <section className="category-browse-shop">
            <div className="category-browse-shop__header">
              <h2>Shop by subcategory</h2>
              {activeSubcategory && (
                <Link to={buildCategoryBrowsePath(categoryName)}>View all in {categoryName}</Link>
              )}
            </div>
            <div className="category-browse-shop__grid">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory}
                  to={buildCategoryBrowsePath(categoryName, subcategory)}
                  className="category-browse-shop__card"
                >
                  <div className="category-browse-shop__icon">
                    <CategoryIcon icon={getCategoryIconName(subcategory)} />
                  </div>
                  <span>{subcategory}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="category-browse-products">
            <div className="category-browse-products__header">
              <h2>
                {activeSubcategory
                  ? `${activeSubcategory} in ${categoryName}`
                  : `All ${categoryName} products`}
              </h2>
              <span>{products.length} result{products.length !== 1 ? 's' : ''}</span>
            </div>

            {products.length > 0 ? (
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <PanelEmptyState
                title="No products in this category yet"
                message={
                  activeSubcategory
                    ? `Approved seller listings for ${activeSubcategory} will appear here.`
                    : `Approved seller listings for ${categoryName} will appear here.`
                }
              />
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
