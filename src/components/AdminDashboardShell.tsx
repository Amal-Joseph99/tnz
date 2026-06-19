import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const adminNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Sellers', to: '/admin/sellers' },
  { label: 'KYC Approvals', to: '/admin/kyc' },
  { label: 'Products', to: '/admin/products' },
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
  return (
    <section className="admin-console">
      <aside className="admin-console__sidebar">
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
        <Link to="/seller/signin" className="admin-console__signout">Sign out</Link>
      </aside>

      <div className="admin-console__workspace">
        <header className="admin-console__header">
          <div>
            <span>Admin Console</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="admin-console__header-actions">
            <Link to="/admin/notifications" className="admin-console__notification">
              Alerts
              <strong>4</strong>
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
