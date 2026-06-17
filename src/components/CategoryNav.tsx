import { categories } from '../data/products'
import { CategoryIcon } from './Icons'
import { Link } from 'react-router-dom'

function getCategoryPath(label: string) {
  return `/category/${label.toLowerCase().replaceAll(' ', '-')}`
}

export function CategoryNav() {
  return (
    <section className="categories">
      <div className="container">
        <div className="categories__header">
          <h2>Shop by Category</h2>
          <Link to="/categories">
            View All <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="categories__scroll" role="list">
          {categories.map((cat) => (
            <Link key={cat.label} to={getCategoryPath(cat.label)} className="category-card" role="listitem">
              <div className="category-card__icon">
                <CategoryIcon icon={cat.icon} />
              </div>
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
