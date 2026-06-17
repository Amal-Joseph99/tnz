import { FeaturedProducts } from '../components/FeaturedProducts'
import { PageShell } from '../components/PageShell'

export function SearchResultsPage() {
  return (
    <PageShell
      eyebrow="Search"
      title="Search results"
      subtitle="Explore matching products, brands, and offers across AGTRENZ."
    >
      <FeaturedProducts />
    </PageShell>
  )
}
