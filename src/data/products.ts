export type Product = {
  id: string
  title: string
  brand: string
  price: number
  originalPrice?: number
  discount?: string
  badge?: string
  rating: number
  reviews: number
  image: string
  images: string[]
  listingCurrencyCode: string
  sellerUserId: string
  sku: string
  variantId?: string
}

export const featuredProducts: Product[] = []

export const trendingProducts: Product[] = []
