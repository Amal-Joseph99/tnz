import { FeaturedProducts } from '../components/FeaturedProducts'
import { PageShell } from '../components/PageShell'

export function BestSellersPage() {
  return (
    <PageShell
      eyebrow="Shop"
      title="Best sellers"
      subtitle="Shop products customers are buying and loving right now."
    >
      <FeaturedProducts />
    </PageShell>
  )
}
