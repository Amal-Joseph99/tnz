import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryIcon } from '../components/Icons'
import { PageShell } from '../components/PageShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchStorefrontCategoryNames } from '../lib/catalogCategories'
import { getCategoryIconName, getCategorySlug } from '../lib/categoryDisplay'

export function CategoriesPage() {
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

  return (
    <PageShell
      eyebrow="Shop"
      title="All categories"
      subtitle="Explore AGTRENZ categories and find products across every collection."
    >
      {loading ? (
        <p>Loading categories...</p>
      ) : categoryNames.length === 0 ? (
        <PanelEmptyState
          title="No categories available yet"
          message="Administrators can add categories from the admin Category management page."
        />
      ) : (
        <div className="category-page-grid">
          {categoryNames.map((name) => (
            <Link
              key={name}
              to={`/category/${getCategorySlug(name)}`}
              className="category-page-card"
            >
              <CategoryIcon icon={getCategoryIconName(name)} />
              <span>{name}</span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}
