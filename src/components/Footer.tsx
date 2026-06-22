import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { FacebookIcon, InstagramIcon, LinkedInIcon, YoutubeIcon } from './Icons'
import { Logo } from './Logo'
import { footerLegalLinks } from '../lib/legalDocuments'
import { subscribeNewsletter } from '../lib/marketplaceBackend'

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/agtrenz', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/agtrenz', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@agtrenz', Icon: YoutubeIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/agtrenz', Icon: LinkedInIcon },
] as const

export function Footer() {
  const [email, setEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')

  const handleNewsletter = async (event: FormEvent) => {
    event.preventDefault()
    const result = await subscribeNewsletter(email)
    setNewsletterMessage(result.ok ? 'Subscribed successfully.' : result.message)
  }

  return (
    <footer className="footer">
      <div className="container footer__main">
        <div className="footer__brand">
          <Logo className="header__logo header__logo--footer" />
          <p>Your trusted global marketplace for quality products delivered worldwide.</p>
          <div className="footer__social" aria-label="Social media">
            {socialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <Icon />
              </a>
            ))}
          </div>
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
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              {footerLegalLinks.map((link) => (
                <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__newsletter">
          <h4>Newsletter</h4>
          <p>Subscribe for exclusive deals and updates.</p>
          {newsletterMessage && <p>{newsletterMessage}</p>}
          <form className="footer__form" onSubmit={(event) => void handleNewsletter(event)}>
            <input type="email" placeholder="Your email address" aria-label="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <button type="submit" className="btn btn--primary">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="container footer__bottom">
        <div className="footer__bottom-row">
          <p className="footer__copyright">&copy; 2026 AGTRENZ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
