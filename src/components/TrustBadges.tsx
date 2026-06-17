import { GlobeIcon, HeadsetIcon, ReturnIcon, ShieldIcon } from './Icons'

const badges = [
  { icon: ShieldIcon, title: 'Secure Checkout', subtitle: 'Encrypted payments' },
  { icon: ReturnIcon, title: 'Free Returns', subtitle: '30-day hassle free returns' },
  { icon: HeadsetIcon, title: '24/7 Support', subtitle: "We're here to help anytime" },
  { icon: GlobeIcon, title: 'Global Delivery', subtitle: 'Shipping to 120+ countries' },
]

export function TrustBadges() {
  return (
    <section className="trust-badges">
      <div className="container trust-badges__grid">
        {badges.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="trust-badge">
            <div className="trust-badge__icon">
              <Icon />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
