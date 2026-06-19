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
}

export const featuredProducts: Product[] = []

export const trendingProducts: Product[] = []
