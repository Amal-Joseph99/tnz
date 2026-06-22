const BENTO_IMAGES = {
  cartLaptop: '/auth/bento-shopping-1.jpeg',
  shoppingBags: '/auth/bento-shopping-2.jpeg',
  cartPhone: '/auth/bento-shopping-3.jpeg',
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
        className="auth-bento__tile auth-bento__tile--image"
        style={{ backgroundImage: `url(${BENTO_IMAGES.cartPhone})` }}
      />
    </aside>
  )
}
