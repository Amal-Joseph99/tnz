import { Link } from 'react-router-dom'
import { CartIcon, GlobeIcon, HeadsetIcon, ShieldIcon } from '../components/Icons'

const sellerBenefits = [
  {
    icon: GlobeIcon,
    title: 'Reach more customers',
    text: 'List products across AGTRENZ and grow your business with a larger marketplace audience.',
  },
  {
    icon: CartIcon,
    title: 'Simple order tools',
    text: 'Manage products, pricing, inventory, and orders from one seller dashboard.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure payments',
    text: 'Get reliable payouts with trusted payment protection and seller-first reporting.',
  },
  {
    icon: HeadsetIcon,
    title: 'Seller support',
    text: 'Access onboarding help and support resources when you need them.',
  },
]

export function SellersLandingPage() {
  return (
    <section className="seller-page">
      <div className="seller-hero">
        <div className="container seller-hero__inner">
          <div className="seller-hero__content">
            <span className="seller-hero__eyebrow">Sell on AGTRENZ</span>
            <h1>Start selling with AGTRENZ today</h1>
            <p>
              Join a fast-growing marketplace and reach shoppers looking for quality products,
              better deals, and trusted sellers.
            </p>
            <div className="seller-hero__actions">
              <Link to="/seller/signin" className="seller-start-btn">
                Start Selling
              </Link>
              <a href="#seller-benefits" className="seller-secondary-btn">
                Learn More
              </a>
            </div>
            <small>No monthly subscription required to get started.</small>
          </div>

          <div className="seller-hero__card" aria-label="Seller overview">
            <div>
              <span>Potential reach</span>
              <strong>120+ countries</strong>
            </div>
            <div>
              <span>Setup time</span>
              <strong>15 minutes</strong>
            </div>
            <div>
              <span>Seller tools</span>
              <strong>Built in</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="container seller-steps">
        <h2>How selling works</h2>
        <div className="seller-steps__grid">
          {['Create your account', 'List your products', 'Ship your orders', 'Get paid'].map(
            (step, index) => (
              <article key={step} className="seller-step-card">
                <span>{index + 1}</span>
                <h3>{step}</h3>
                <p>Follow a simple guided flow built for new and growing sellers.</p>
              </article>
            ),
          )}
        </div>
      </div>

      <div className="container seller-benefits" id="seller-benefits">
        <h2>Why sell on AGTRENZ?</h2>
        <div className="seller-benefits__grid">
          {sellerBenefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="seller-benefit-card">
              <div className="seller-benefit-card__icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
