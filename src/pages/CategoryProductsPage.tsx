import { useParams } from 'react-router-dom'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { PageShell } from '../components/PageShell'

function formatCategory(value?: string) {
  if (!value) return 'Category'
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function CategoryProductsPage() {
  const { categorySlug } = useParams()
  const category = formatCategory(categorySlug)

  return (
    <PageShell
      eyebrow="Category"
      title={category}
      subtitle={`Browse popular ${category.toLowerCase()} products available on AGTRENZ.`}
    >
      <FeaturedProducts />
    </PageShell>
  )
}
