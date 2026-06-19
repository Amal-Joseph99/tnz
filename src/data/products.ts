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

export const categories = [
  { label: 'Luggage', icon: 'luggage' },
  { label: 'Home', icon: 'home' },
  { label: 'Fashion', icon: 'fashion' },
  { label: 'Beauty', icon: 'beauty' },
  { label: 'Electronics', icon: 'electronics' },
  { label: 'Combo', icon: 'combo' },
  { label: 'Others', icon: 'others' },
  { label: 'Grocery', icon: 'grocery' },
]
