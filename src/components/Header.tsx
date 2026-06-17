import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
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
  const [signedIn, setSignedIn] = useState(false)
  const navigate = useNavigate()
  const { currency, locationLabel, loading, refreshLocation } = useCurrency()

  const handleAuthClick = () => {
    setSignedIn((value) => !value)
    setAccountOpen(false)
  }

  const handleSearch = () => {
    navigate('/search')
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <button
          type="button"
          className={`header__hamburger${menuOpen ? ' header__hamburger--open' : ''}`}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>

        <Link to="/" className="header__logo" aria-label="AGTRENZ home">
          <span className="logo-prefix">AG</span>
          <span className="logo-highlight">T</span>
          <span className="logo-suffix">RENZ</span>
        </Link>

        <form className="header__search" onSubmit={(event) => {
          event.preventDefault()
          handleSearch()
        }}>
          <input type="search" placeholder="Search for products, brands..." aria-label="Search products" />
          <button type="submit" className="header__search-btn" aria-label="Search">
            <span className="header__search-text">Go</span>
            <SearchIcon />
          </button>
        </form>

        <div className="header__actions">
          <button
            type="button"
            className="header__location"
            onClick={refreshLocation}
            title="Refresh location"
          >
            <LocationIcon />
            <span className="header__location-text">
              {loading ? 'Locating…' : locationLabel}
            </span>
          </button>
          <span className="header__currency">{currency}</span>
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
                {signedIn ? (
                  <button type="button" role="menuitem" onClick={handleAuthClick}>
                    Signout
                  </button>
                ) : (
                  <Link to="/buyer/signin" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Signin
                  </Link>
                )}
              </div>
            )}
          </div>
          <Link to="/cart" className="header__cart" aria-label="Shopping cart">
            <CartIcon />
            <span className="header__cart-badge">2</span>
          </Link>
        </div>
      </div>

      <div className={`header__mobile-search${menuOpen ? ' header__mobile-search--hidden' : ''}`}>
        <div className="container">
          <form className="header__search header__search--mobile" onSubmit={(event) => {
            event.preventDefault()
            handleSearch()
          }}>
            <input type="search" placeholder="Search products…" aria-label="Search products" />
            <button type="submit" className="header__search-btn" aria-label="Search">
              <span className="header__search-text">Go</span>
              <SearchIcon />
            </button>
          </form>
        </div>
      </div>

      <nav className={`header__drawer${menuOpen ? ' header__drawer--open' : ''}`} aria-hidden={!menuOpen}>
        <button type="button" className="header__drawer-location" onClick={refreshLocation}>
          <LocationIcon />
          <span>{loading ? 'Detecting location...' : locationLabel}</span>
        </button>

        <label className="header__drawer-currency">
          <span>Currency</span>
          <strong>{currency}</strong>
        </label>

        <div className="header__drawer-auth">
          <Link to={signedIn ? '/' : '/buyer/signin'} onClick={() => {
            if (signedIn) handleAuthClick()
            setMenuOpen(false)
          }}>
            {signedIn ? 'Signout' : 'Login'}
          </Link>
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
