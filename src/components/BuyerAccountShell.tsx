import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchBuyerAccount } from '../lib/marketplaceBackend'
import { MenuIcon, XIcon } from './Icons'

const accountNav = [
  { label: 'Profile', to: '/profile' },
  { label: 'Orders', to: '/orders' },
  { label: 'Notifications', to: '/notifications' },
  { label: 'Help Center', to: '/help' },
]

type BuyerAccountShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}

export function BuyerAccountShell({ title, subtitle, children, action }: BuyerAccountShellProps) {
  const location = useLocation()
  const { isSignedIn, accountType, signOutWithConfirm } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const [displayName, setDisplayName] = useState('Your account')
  const [displayHint, setDisplayHint] = useState('Sign in to view profile details')

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isSignedIn || accountType !== 'buyer') {
      setDisplayName('Your account')
      setDisplayHint('Sign in to view profile details')
      return
    }

    void fetchBuyerAccount().then(({ profile }) => {
      if (profile?.full_name) {
        setDisplayName(profile.full_name)
        setDisplayHint('Manage your AGTRENZ account')
      }
    })
  }, [accountType, isSignedIn])

  const userInitial = displayName.trim().charAt(0).toUpperCase() || '•'

  return (
    <section className="buyer-account-page">
      <div className="container buyer-account">
        <aside className="buyer-account__sidebar buyer-account__sidebar--desktop" aria-label="Account navigation">
          <div className="buyer-account__user">
            <div className="buyer-account__avatar">{userInitial}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{displayHint}</span>
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
          <button type="button" className="buyer-account__signout" onClick={() => void signOutWithConfirm()}>
            Sign out
          </button>
        </aside>

        <div className="buyer-account__main">
          <nav className="buyer-account__quick-nav" aria-label="Account sections">
            {accountNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'buyer-account__quick-nav-btn buyer-account__quick-nav-btn--active'
                    : 'buyer-account__quick-nav-btn'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <header className="buyer-account__header">
            <button
              type="button"
              className="buyer-account__menu-toggle"
              aria-expanded={navOpen}
              aria-controls="buyer-account-mobile-nav"
              onClick={() => setNavOpen((value) => !value)}
            >
              {navOpen ? <XIcon /> : <MenuIcon />}
              <span>More</span>
            </button>
            <div className="buyer-account__header-row">
              <div>
                <span>My account</span>
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              {action && <div className="buyer-account__header-action">{action}</div>}
            </div>
          </header>

          {navOpen && (
            <div
              className="buyer-account__drawer-backdrop"
              role="presentation"
              onClick={() => setNavOpen(false)}
            >
              <nav
                id="buyer-account-mobile-nav"
                className="buyer-account__drawer"
                aria-label="Account navigation"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="buyer-account__user">
                  <div className="buyer-account__avatar">{userInitial}</div>
                  <div>
                    <strong>{displayName}</strong>
                    <span>{displayHint}</span>
                  </div>
                </div>
                {accountNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? 'buyer-account__link buyer-account__link--active' : 'buyer-account__link'
                    }
                    onClick={() => setNavOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <button type="button" className="buyer-account__signout" onClick={() => void signOutWithConfirm()}>
                  Sign out
                </button>
              </nav>
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  )
}
