import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BellIcon, MenuIcon, XIcon } from './Icons'
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

function resolveSellerPageTitle(pathname: string) {
  if (/^\/seller\/orders\/\d+$/.test(pathname)) return 'Order details'
  if (pathname.startsWith('/seller/products/')) return 'Product listing'

  const item = sellerNavItems.find((nav) => pathname === nav.to || pathname.startsWith(`${nav.to}/`))
  return item?.label ?? 'Seller Central'
}

type SellerDashboardShellProps = {
  title?: string
  subtitle?: string
  hidePageHeading?: boolean
  children: ReactNode
}

export function SellerDashboardShell({
  title,
  subtitle,
  hidePageHeading = false,
  children,
}: SellerDashboardShellProps) {
  const { signOutFromConsole } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const pageTitle = title ?? resolveSellerPageTitle(pathname)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'seller-console__link seller-console__link--active' : 'seller-console__link'

  return (
    <section className="seller-console seller-console--bento">
      <button
        type="button"
        className={`seller-console__drawer-backdrop${drawerOpen ? ' seller-console__drawer-backdrop--open' : ''}`}
        aria-label="Close navigation menu"
        onClick={closeDrawer}
      />

      <aside
        className={`seller-console__drawer${drawerOpen ? ' seller-console__drawer--open' : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div className="seller-console__drawer-head">
          <Link to="/seller/dashboard" className="seller-console__brand" onClick={closeDrawer}>
            <span>AG</span>TRENZ Seller
          </Link>
          <button type="button" className="seller-console__drawer-close" onClick={closeDrawer} aria-label="Close menu">
            <XIcon />
          </button>
        </div>
        <nav className="seller-console__nav" aria-label="Seller dashboard navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/seller/kyc' ? false : undefined}
              onClick={closeDrawer}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="seller-console__signout" onClick={() => void signOutFromConsole()}>
          Sign out
        </button>
      </aside>

      <aside className="seller-console__sidebar" aria-label="Seller desktop navigation">
        <button type="button" className="console-back-btn" onClick={() => void signOutFromConsole()}>
          ← Back
        </button>

        <Link to="/seller/dashboard" className="seller-console__brand" aria-label="AGTRENZ Seller Central">
          <span>AG</span>TRENZ Seller
        </Link>

        <nav className="seller-console__nav" aria-label="Seller dashboard navigation">
          {sellerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/seller/kyc' ? false : undefined}
              className={navLinkClass}
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
        <header className="seller-console__bar seller-console__mobile-bar">
          <button
            type="button"
            className="seller-console__menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <MenuIcon />
          </button>

          <h1 className="seller-console__mobile-title">{pageTitle}</h1>

          <div className="seller-console__mobile-actions">
            <Link to="/seller/notifications" className="seller-console__mobile-bell" aria-label="Notifications">
              <BellIcon />
              <span>3</span>
            </Link>
          </div>
        </header>

        <header className="seller-console__bar seller-console__header seller-console__header--desktop">
          <span className="seller-console__header-brand">AGTRENZ Seller Central</span>
          <div className="seller-console__header-actions">
            <Link to="/seller/notifications" className="seller-console__notification" aria-label="Notifications">
              <BellIcon />
              <strong>3</strong>
            </Link>
          </div>
        </header>

        <div className="seller-console__scroll">
          <main className="seller-console__content seller-console__content--bento">
            {!hidePageHeading ? (
              <div className="seller-console__page-heading">
                <h1>{pageTitle}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>

        <footer className="seller-console__bar seller-console__footer">
          <span>AGTRENZ Seller Central</span>
          <span>Manage your store, orders, and payouts.</span>
        </footer>
      </div>
    </section>
  )
}
