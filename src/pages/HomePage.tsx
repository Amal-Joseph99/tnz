import { useEffect } from 'react'
import { CategoryNav } from '../components/CategoryNav'
import { FeaturedProducts } from '../components/FeaturedProducts'
import { Hero } from '../components/Hero'
import { PromoBanner } from '../components/PromoBanner'
import { TrendingNow } from '../components/TrendingNow'
import { TrustBadges } from '../components/TrustBadges'
import { useCurrency } from '../context/CurrencyContext'

export function HomePage() {
  const { ensureHomepageLocation } = useCurrency()

  useEffect(() => {
    void ensureHomepageLocation()
  }, [ensureHomepageLocation])

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
