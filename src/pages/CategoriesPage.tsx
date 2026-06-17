import { Link } from 'react-router-dom'
import { CategoryIcon } from '../components/Icons'
import { PageShell } from '../components/PageShell'
import { categories } from '../data/products'

export function CategoriesPage() {
  return (
    <PageShell
      eyebrow="Shop"
      title="All categories"
      subtitle="Explore AGTRENZ categories and find products across every collection."
    >
      <div className="category-page-grid">
        {categories.map((category) => (
          <Link
            key={category.label}
            to={`/category/${category.label.toLowerCase().replaceAll(' ', '-')}`}
            className="category-page-card"
          >
            <CategoryIcon icon={category.icon} />
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
