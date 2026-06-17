import { SunIcon } from './Icons'

export function PromoBanner() {
  return (
    <section className="promo-banner">
      <div className="container promo-banner__inner">
        <div className="promo-banner__leaf promo-banner__leaf--left" aria-hidden="true" />
        <p className="promo-banner__text">
          <SunIcon />
          Summer Sale — Up to 40% Off Worldwide
        </p>
        <button type="button" className="btn btn--brown">
          Shop the Sale
        </button>
        <div className="promo-banner__leaf promo-banner__leaf--right" aria-hidden="true" />
      </div>
    </section>
  )
}
