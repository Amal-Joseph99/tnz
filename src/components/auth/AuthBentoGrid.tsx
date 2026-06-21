const BENTO_IMAGES = {
  cartLaptop:
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  shoppingBags:
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
  cartPhone:
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
} as const

export function AuthBentoGrid() {
  return (
    <aside className="auth-bento" aria-hidden="true">
      <div
        className="auth-bento__tile auth-bento__tile--image"
        style={{ backgroundImage: `url(${BENTO_IMAGES.cartLaptop})` }}
      />
      <div
        className="auth-bento__tile auth-bento__tile--image"
        style={{ backgroundImage: `url(${BENTO_IMAGES.shoppingBags})` }}
      />
      <div className="auth-bento__tile auth-bento__tile--quote">
        <p>Less noise. More style.</p>
      </div>
      <div
        className="auth-bento__tile auth-bento__tile--image auth-bento__tile--lavender"
        style={{ backgroundImage: `url(${BENTO_IMAGES.cartPhone})` }}
      />
    </aside>
  )
}
