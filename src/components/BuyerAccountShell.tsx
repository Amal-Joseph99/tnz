import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const accountNav = [
  { label: 'Profile', to: '/profile' },
  { label: 'Orders', to: '/orders' },
  { label: 'Notifications', to: '/notifications' },
  { label: 'Help Center', to: '/help' },
]

type BuyerAccountShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  action?: ReactNode
}

export function BuyerAccountShell({ title, subtitle, children, action }: BuyerAccountShellProps) {
  return (
    <section className="buyer-account-page">
      <div className="container buyer-account">
        <aside className="buyer-account__sidebar">
          <div className="buyer-account__user">
            <div className="buyer-account__avatar">•</div>
            <div>
              <strong>Your account</strong>
              <span>Sign in to view profile details</span>
            </div>
          </div>
          <nav className="buyer-account__nav">
            {accountNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? 'buyer-account__link buyer-account__link--active' : 'buyer-account__link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/buyer/signin" className="buyer-account__signout">Sign out</Link>
        </aside>

        <div className="buyer-account__main">
          <header className="buyer-account__header">
            <div>
              <span>My account</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {action}
          </header>
          {children}
        </div>
      </div>
    </section>
  )
}
