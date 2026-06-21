import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BellIcon, MenuIcon, XIcon } from './Icons'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'

const adminNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Sellers', to: '/admin/sellers' },
  { label: 'KYC Approvals', to: '/admin/kyc' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Categories', to: '/admin/categories' },
  { label: 'Homepage sections', to: '/admin/homepage-sections' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Returns', to: '/admin/returns' },
  { label: 'Support', to: '/admin/support' },
  { label: 'Notifications', to: '/admin/notifications' },
  { label: 'Settings', to: '/admin/settings' },
  { label: 'Help', to: '/admin/help' },
]

type AdminDashboardShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AdminDashboardShell({ title, subtitle, children }: AdminDashboardShellProps) {
  const { signOutFromConsole } = useAuth()
  const { adminCurrencyOptions, currency, loading, pricingReady, setAdminCurrency } = useCurrency()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  const currencySelect = (
    <select
      className="admin-console__currency-select"
      value={pricingReady ? currency : ''}
      disabled={loading || !pricingReady || adminCurrencyOptions.length === 0}
      onChange={(event) => void setAdminCurrency(event.target.value)}
      aria-label="Display currency"
    >
      {adminCurrencyOptions.map((option) => (
        <option key={option.currencyCode} value={option.currencyCode}>
          {option.currencyCode}
        </option>
      ))}
    </select>
  )

  return (
    <section className="admin-console admin-console--bento">
      <button
        type="button"
        className={`admin-console__drawer-backdrop${drawerOpen ? ' admin-console__drawer-backdrop--open' : ''}`}
        aria-label="Close navigation menu"
        onClick={closeDrawer}
      />

      <aside className={`admin-console__drawer${drawerOpen ? ' admin-console__drawer--open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="admin-console__drawer-head">
          <Link to="/admin/dashboard" className="admin-console__brand" onClick={closeDrawer}>
            <span>AG</span>TRENZ Admin
          </Link>
          <button type="button" className="admin-console__drawer-close" onClick={closeDrawer} aria-label="Close menu">
            <XIcon />
          </button>
        </div>
        <nav className="admin-console__nav" aria-label="Admin console navigation">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeDrawer}
              className={({ isActive }) =>
                isActive ? 'admin-console__link admin-console__link--active' : 'admin-console__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="admin-console__signout" onClick={() => void signOutFromConsole()}>
          Sign out
        </button>
      </aside>

      <aside className="admin-console__sidebar" aria-label="Admin desktop navigation">
        <button type="button" className="console-back-btn" onClick={() => void signOutFromConsole()}>
          ← Back
        </button>

        <Link to="/admin/dashboard" className="admin-console__brand" aria-label="AGTRENZ Admin Console">
          <span>AG</span>TRENZ Admin
        </Link>
        <nav className="admin-console__nav" aria-label="Admin console navigation">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'admin-console__link admin-console__link--active' : 'admin-console__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="admin-console__signout" onClick={() => void signOutFromConsole()}>
          Sign out
        </button>
      </aside>

      <div className="admin-console__workspace">
        <header className="admin-console__mobile-bar">
          <button
            type="button"
            className="admin-console__menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <MenuIcon />
          </button>

          <h1 className="admin-console__mobile-title">{title}</h1>

          <div className="admin-console__mobile-actions">
            {currencySelect}
            <Link to="/admin/notifications" className="admin-console__mobile-bell" aria-label="Alerts">
              <BellIcon />
              <span>0</span>
            </Link>
          </div>
        </header>

        <header className="admin-console__header admin-console__header--bento">
          <div className="admin-console__header-copy">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="admin-console__header-actions">
            {currencySelect}
            <Link to="/admin/notifications" className="admin-console__notification" aria-label="Alerts">
              <BellIcon />
              <strong>0</strong>
            </Link>
          </div>
        </header>

        <main className="admin-console__content admin-console__content--bento">{children}</main>
      </div>
    </section>
  )
}
