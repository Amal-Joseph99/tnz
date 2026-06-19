import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryIcon } from './Icons'
import { fetchStorefrontCategoryNames } from '../lib/catalogCategories'
import { getCategoryIconName, getCategorySlug } from '../lib/categoryDisplay'

export function CategoryNav() {
  const [categoryNames, setCategoryNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchStorefrontCategoryNames()
      .then((names) => {
        if (active) setCategoryNames(names)
      })
      .catch(() => {
        if (active) setCategoryNames([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (!loading && categoryNames.length === 0) {
    return null
  }

  return (
    <section className="categories">
      <div className="container">
        <div className="categories__header">
          <h2>Shop by Category</h2>
          <Link to="/categories">
            View All <span aria-hidden="true">›</span>
          </Link>
        </div>
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <div className="categories__scroll" role="list">
            {categoryNames.map((name) => (
              <Link key={name} to={`/category/${getCategorySlug(name)}`} className="category-card" role="listitem">
                <div className="category-card__icon">
                  <CategoryIcon icon={getCategoryIconName(name)} />
                </div>
                <span>{name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
