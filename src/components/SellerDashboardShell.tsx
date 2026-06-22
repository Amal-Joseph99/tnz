import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const sellerNavItems = [
  { label: 'Dashboard', to: '/seller/dashboard' },
  { label: 'Profile', to: '/seller/profile' },
  { label: 'KYC Verification', to: '/seller/kyc' },
  { label: 'Warehouse', to: '/seller/warehouse' },
  { label: 'Products', to: '/seller/products' },
  { label: 'Orders', to: '/seller/orders' },
  { label: 'Wallet', to: '/seller/wallet' },
  { label: 'Help', to: '/seller/help' },
  { label: 'Terms & Policies', to: '/seller/terms-policies' },
]

type SellerDashboardShellProps = {
  children: ReactNode
}

export function SellerDashboardShell({ children }: SellerDashboardShellProps) {
  const { signOutFromConsole } = useAuth()

  return (
    <section className="seller-console">
      <aside className="seller-console__sidebar">
        <button type="button" className="console-back-btn" onClick={() => void signOutFromConsole()}>
          ← Back
        </button>

        <Link to="/seller/dashboard" className="seller-console__brand" aria-label="AGTRENZ Seller Central">
          <span>AG</span>TRENZ
        </Link>

        <nav className="seller-console__nav" aria-label="Seller dashboard navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/seller/kyc' ? false : undefined}
              className={({ isActive }) => (
                isActive ? 'seller-console__nav-link seller-console__nav-link--active' : 'seller-console__nav-link'
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="seller-console__signout" onClick={() => void signOutFromConsole()}>
          Sign out
        </button>
      </aside>

      <div className="seller-console__workspace">
        <header className="seller-console__bar seller-console__header">
          <div className="seller-console__header-actions">
            <Link to="/seller/notifications" className="seller-console__notification">
              Notifications
              <strong>3</strong>
            </Link>
          </div>
        </header>

        <nav className="seller-console__mobile-nav" aria-label="Seller dashboard mobile navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/seller/kyc' ? false : undefined}
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

        <footer className="seller-console__bar seller-console__footer">
          <span>AGTRENZ Seller Central</span>
          <span>Manage your store, orders, and payouts.</span>
        </footer>
      </div>
    </section>
  )
}
