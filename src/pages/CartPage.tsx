import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

export function CartPage() {
  return (
    <PageShell
      eyebrow="Shopping cart"
      title="Your cart"
      subtitle="Review products, update quantities, and proceed to checkout."
    >
      <div className="cart-empty">
        <h2>Your cart is ready for great finds.</h2>
        <p>Add products from the homepage to see them here.</p>
        <Link to="/">Continue shopping</Link>
      </div>
    </PageShell>
  )
}
