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

export const featuredProducts: Product[] = [
  {
    id: '1',
    title: 'Aahwan Solid Square Neck Bodycon Mermaid Hem Sleeveless Dress',
    brand: 'AAHWAN',
    price: 9.59,
    originalPrice: 10.79,
    discount: '11% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 128,
    image:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&h=500&fit=crop',
  },
  {
    id: '2',
    title: 'OVIOL Spoon Stand for Kitchen Steel Cutlery Stand Spoon Holder',
    brand: 'OVIOL',
    price: 7.43,
    originalPrice: 11.99,
    discount: '38% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 256,
    image:
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&h=500&fit=crop',
  },
  {
    id: '3',
    title: 'SWAGR Ankle Socks for Men & Women, Multicolor Pack of 5',
    brand: 'SW',
    price: 1.67,
    originalPrice: 3.59,
    discount: '54% OFF',
    badge: 'Brand New',
    rating: 4,
    reviews: 89,
    image:
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500&h=500&fit=crop',
  },
  {
    id: '4',
    title: 'JVX Men T-Shirt | Full Sleeve T Shirt (MRT-209)',
    brand: 'JVX',
    price: 6.35,
    originalPrice: 11.99,
    discount: '47% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 312,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
  },
  {
    id: '5',
    title: 'SLOVIC Steel Water Bottle 1 Ltr | UV Print Fridge Bottle',
    brand: 'SLOVIC',
    price: 3.59,
    originalPrice: 6.95,
    discount: '48% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 194,
    image:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
  },
  {
    id: '6',
    title: "BLOSSOM Women's Everyday T-Shirt Bra with Molded Cups",
    brand: 'BLOSSOM',
    price: 4.31,
    originalPrice: 10.31,
    discount: '58% OFF',
    badge: 'Brand New',
    rating: 4,
    reviews: 221,
    image:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop',
  },
  {
    id: '7',
    title: 'Premium Travel Duffle Bag with Shoes Compartment',
    brand: 'VOYAGE',
    price: 12.99,
    originalPrice: 21.99,
    discount: '41% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 501,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
  },
  {
    id: '8',
    title: 'Wireless Over-Ear Bluetooth Headphones with Deep Bass',
    brand: 'SOUNDZ',
    price: 17.99,
    originalPrice: 28.99,
    discount: '38% OFF',
    badge: 'Brand New',
    rating: 5,
    reviews: 680,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
  },
]

export const trendingProducts: Product[] = [
  {
    id: 't1',
    title: 'Minimalist Sneakers',
    brand: 'StepUp',
    price: 119.0,
    originalPrice: 159.0,
    discount: '25% OFF',
    badge: 'Trending',
    rating: 5,
    reviews: 445,
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
  },
  {
    id: 't2',
    title: 'Smart Fitness Tracker',
    brand: 'FitPulse',
    price: 49.99,
    originalPrice: 79.99,
    discount: '38% OFF',
    badge: 'Trending',
    rating: 4,
    reviews: 892,
    image:
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
  },
  {
    id: 't3',
    title: 'Ceramic Plant Pot Set',
    brand: 'HomeNest',
    price: 34.99,
    originalPrice: 59.99,
    discount: '42% OFF',
    badge: 'Trending',
    rating: 5,
    reviews: 167,
    image:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
  },
  {
    id: 't4',
    title: 'Organic Skincare Bundle',
    brand: 'PureGlow',
    price: 45.0,
    originalPrice: 72.0,
    discount: '38% OFF',
    badge: 'Trending',
    rating: 5,
    reviews: 523,
    image:
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
  },
]

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
