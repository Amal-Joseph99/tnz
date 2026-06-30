import { CategoryNav } from '../components/CategoryNav'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { Hero } from '../components/Hero'
import { PromoBanner } from '../components/PromoBanner'
import { TrendingNow } from '../components/TrendingNow'
import { TrustBadges } from '../components/TrustBadges'

export function HomePage() {
  return (
    <>
      <Hero />
      <CategoryNav />
      <FeaturedProducts />
      <PromoBanner />
      <TrendingNow />
      <TrustBadges />
    </>
  )
}
