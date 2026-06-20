import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'

const adminNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Sellers', to: '/admin/sellers' },
  { label: 'KYC Approvals', to: '/admin/kyc' },
  { label: 'Products', to: '/admin/products' },
  { label: 'Category management', to: '/admin/categories' },
  { label: 'Homepage sections', to: '/admin/homepage-sections' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Notifications', to: '/admin/notifications' },
  { label: 'Settings', to: '/admin/settings' },
]

type AdminDashboardShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AdminDashboardShell({ title, subtitle, children }: AdminDashboardShellProps) {
  const { signOutFromConsole } = useAuth()
  const { adminCurrencyOptions, currency, loading, pricingReady, setAdminCurrency } = useCurrency()

  return (
    <section className="admin-console">
      <aside className="admin-console__sidebar">
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
        <header className="admin-console__header">
          <div>
            <span>Admin Console</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="admin-console__header-actions">
            <label className="admin-console__currency">
              <span>Currency</span>
              <select
                value={pricingReady ? currency : ''}
                disabled={loading || !pricingReady || adminCurrencyOptions.length === 0}
                onChange={(event) => void setAdminCurrency(event.target.value)}
                aria-label="Admin display currency"
              >
                {adminCurrencyOptions.map((option) => (
                  <option key={option.currencyCode} value={option.currencyCode}>
                    {option.displayLabel}
                  </option>
                ))}
              </select>
            </label>
            <Link to="/admin/notifications" className="admin-console__notification">
              Alerts
              <strong>0</strong>
            </Link>
            <div className="admin-console__account">
              <strong>Platform Administrator</strong>
              <span>Full access</span>
            </div>
          </div>
        </header>

        <nav className="admin-console__mobile-nav" aria-label="Admin console mobile navigation">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'admin-console__mobile-link admin-console__mobile-link--active' : 'admin-console__mobile-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="admin-console__content">{children}</main>

        <footer className="admin-console__footer">
          <span>AGTRENZ Admin Console</span>
          <span>Restricted access for authorized administrators only.</span>
        </footer>
      </div>
    </section>
  )
}
