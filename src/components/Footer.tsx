import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__main">
        <div className="footer__brand">
          <Link to="/" className="header__logo">
            <span className="logo-prefix">AG</span>
            <span className="logo-highlight">T</span>
            <span className="logo-suffix">RENZ</span>
          </Link>
          <p>Your trusted global marketplace for quality products delivered worldwide.</p>
        </div>

        <div className="footer__links">
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
              <li><Link to="/best-sellers">Best Sellers</Link></li>
              <li><Link to="/sale">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4>Customer Service</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/track-order">Track Order</Link></li>
              <li><Link to="/returns">Returns</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
              <li><Link to="/sustainability">Sustainability</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer__newsletter">
          <h4>Newsletter</h4>
          <p>Subscribe for exclusive deals and updates.</p>
          <form className="footer__form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" aria-label="Email address" />
            <button type="submit" className="btn btn--primary">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="container footer__bottom">
        <div className="footer__legal">
          <span>&copy; 2026 AGTRENZ. All rights reserved.</span>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
          <Link to="/cookies-settings">Cookies Settings</Link>
        </div>
        <div className="footer__payments">
          {['Visa', 'MC', 'PayPal', 'Amex', 'Apple Pay', 'G Pay'].map((p) => (
            <span key={p} className="payment-badge">
              {p}
            </span>
          ))}
        </div>
        <div className="footer__social">
          {['Facebook', 'Instagram', 'X', 'YouTube'].map((s) => (
            <a key={s} href="#" aria-label={s}>
              {s[0]}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
