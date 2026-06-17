import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const sellerNavItems = [
  { label: 'Dashboard', to: '/seller/dashboard' },
  { label: 'Profile', to: '/seller/profile' },
  { label: 'Warehouse', to: '/seller/warehouse' },
  { label: 'Products', to: '/seller/products' },
  { label: 'Orders', to: '/seller/orders' },
  { label: 'Wallet', to: '/seller/wallet' },
  { label: 'Help', to: '/seller/help' },
  { label: 'Terms & Policies', to: '/seller/terms-policies' },
]

type SellerDashboardShellProps = {
  title: string
  subtitle: string
  eyebrow?: string
  children: ReactNode
}

export function SellerDashboardShell({
  title,
  subtitle,
  eyebrow = 'Seller Central',
  children,
}: SellerDashboardShellProps) {
  return (
    <section className="seller-console">
      <aside className="seller-console__sidebar">
        <Link to="/seller/dashboard" className="seller-console__brand" aria-label="AGTRENZ Seller Central">
          <span>AG</span>TRENZ
        </Link>

        <nav className="seller-console__nav" aria-label="Seller dashboard navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (
                isActive ? 'seller-console__nav-link seller-console__nav-link--active' : 'seller-console__nav-link'
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="seller-console__workspace">
        <header className="seller-console__header">
          <div>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="seller-console__header-actions">
            <Link to="/seller/notifications" className="seller-console__notification">
              Notifications
              <strong>3</strong>
            </Link>
            <div className="seller-console__account">
              <strong>AGTRENZ Seller</strong>
              <span>Verified account</span>
            </div>
          </div>
        </header>

        <nav className="seller-console__mobile-nav" aria-label="Seller dashboard mobile navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (
                isActive ? 'seller-console__mobile-link seller-console__mobile-link--active' : 'seller-console__mobile-link'
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="seller-console__content">
          {children}
        </main>

        <footer className="seller-console__footer">
          <span>AGTRENZ Seller Central</span>
          <span>Secure dashboard access for verified sellers only.</span>
        </footer>
      </div>
    </section>
  )
}
