import { FeaturedProducts } from '../components/FeaturedProducts'
import { PageShell } from '../components/PageShell'

export function NewArrivalsPage() {
  return (
    <PageShell
      eyebrow="Shop"
      title="New arrivals"
      subtitle="Discover the latest products recently added to AGTRENZ."
    >
      <FeaturedProducts />
    </PageShell>
  )
}
