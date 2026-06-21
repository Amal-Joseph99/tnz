import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { appendSearchHistory } from '../lib/searchHistory'
import { Logo } from './Logo'
import {
  CartIcon,
  ChevronDownIcon,
  HeadsetIcon,
  LocationIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from './Icons'

const menuLinks = [
  { label: 'Become a Seller', icon: CartIcon, to: '/sellerslandingpage' },
  { label: 'Help & Support', icon: HeadsetIcon, to: '/help' },
  { label: 'Track Order', icon: CartIcon, to: '/track-order' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { currency, locationLabel, loading, pricingReady, refreshLocation } = useCurrency()
  const { isSignedIn, signOutWithConfirm } = useAuth()

  useEffect(() => {
    if (isSignedIn) {
      setAccountOpen(false)
    }
  }, [isSignedIn])

  const submitSearch = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    void appendSearchHistory({
      searchInput: trimmed,
      productName: trimmed,
    })
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    setMenuOpen(false)
  }

  return (
    <header className={`header${isHome ? ' header--home' : ''}`}>
      <div className="container header__inner">
        <button
          type="button"
          className={`header__hamburger${menuOpen ? ' header__hamburger--open' : ''}`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        <Logo />

        <form className="header__search" onSubmit={(event) => {
          event.preventDefault()
          submitSearch(searchQuery)
        }}>
          <input
            type="search"
            value={searchQuery}
            placeholder="Search for products, brands..."
            aria-label="Search products"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <button type="submit" className="header__search-btn" aria-label="Search">
            <span className="header__search-text">Go</span>
            <SearchIcon />
          </button>
        </form>

        <div className="header__actions">
          <button
            type="button"
            className="header__location"
            onClick={() => void refreshLocation()}
            title="Refresh location"
          >
            <LocationIcon />
            <span className="header__location-text">
              {loading ? 'Locating…' : locationLabel}
            </span>
          </button>
          <span className="header__currency">{loading || !pricingReady ? '…' : currency}</span>
          <Link to="/sellerslandingpage" className="header__sell-now">
            Sell Now
          </Link>
          <div className="header__account">
            <button
              type="button"
              className="header__action header__action--account"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <UserIcon />
              <span>Account</span>
              <ChevronDownIcon />
            </button>

            {accountOpen && (
              <div className="header__account-menu" role="menu">
                <Link to="/profile" role="menuitem" onClick={() => setAccountOpen(false)}>
                  Profile
                </Link>
                <Link to="/orders" role="menuitem" onClick={() => setAccountOpen(false)}>
                  My orders
                </Link>
                <Link to="/notifications" role="menuitem" onClick={() => setAccountOpen(false)}>
                  Notifications
                </Link>
                <Link to="/help" role="menuitem" onClick={() => setAccountOpen(false)}>
                  Help
                </Link>
                {isSignedIn ? (
                  <button type="button" role="menuitem" onClick={() => void signOutWithConfirm()}>
                    Sign out
                  </button>
                ) : (
                  <Link to="/buyer/signin" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Sign in
                  </Link>
                )}
              </div>
            )}
          </div>
          <Link to="/cart" className="header__cart" aria-label="Shopping cart">
            <CartIcon />
            <span className="header__cart-badge">0</span>
          </Link>
        </div>
      </div>

      <div className={`header__mobile-search${menuOpen ? ' header__mobile-search--hidden' : ''}`}>
        <div className="container">
          <form className="header__search header__search--mobile" onSubmit={(event) => {
            event.preventDefault()
            submitSearch(searchQuery)
          }}>
            <input
              type="search"
              value={searchQuery}
              placeholder="Search products…"
              aria-label="Search products"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button type="submit" className="header__search-btn" aria-label="Search">
              <span className="header__search-text">Go</span>
              <SearchIcon />
            </button>
          </form>
        </div>
      </div>

      <nav className={`header__drawer${menuOpen ? ' header__drawer--open' : ''}`} aria-hidden={!menuOpen}>
        <button type="button" className="header__drawer-location" onClick={() => void refreshLocation()}>
          <LocationIcon />
          <span>{loading ? 'Detecting location...' : locationLabel}</span>
        </button>

        <label className="header__drawer-currency">
          <span>Currency</span>
          <strong>{loading || !pricingReady ? '…' : currency}</strong>
        </label>

        <div className="header__drawer-auth">
          <Link to="/sellerslandingpage" className="header__drawer-sell-now" onClick={() => setMenuOpen(false)}>
            Sell Now
          </Link>
          {isSignedIn ? (
            <button type="button" onClick={() => void signOutWithConfirm()}>
              Sign out
            </button>
          ) : (
            <Link to="/buyer/signin" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
          <Link to="/buyer/signup" onClick={() => setMenuOpen(false)}>
            Sign Up
          </Link>
        </div>

        <ul className="header__drawer-links">
          {menuLinks.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              <Link to={to} onClick={() => setMenuOpen(false)}>
                <Icon />
                <span>{label}</span>
                <ChevronDownIcon />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
