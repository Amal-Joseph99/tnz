import { FeaturedProducts } from '../components/FeaturedProducts'
import { PageShell } from '../components/PageShell'

export function SalePage() {
  return (
    <PageShell
      eyebrow="Deals"
      title="Sale"
      subtitle="Find limited-time deals, markdowns, and sponsored offers."
    >
      <FeaturedProducts />
    </PageShell>
  )
}
