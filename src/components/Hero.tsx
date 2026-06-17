import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

const slides = [
  {
    title: 'Shop the World',
    subtitle: 'Free shipping to 120+ countries',
    cta: 'Shop Now',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&h=400&fit=crop',
  },
  {
    title: 'New Season Arrivals',
    subtitle: 'Discover the latest global trends',
    cta: 'Explore',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&h=400&fit=crop',
  },
  {
    title: 'Summer Sale — 40% Off',
    subtitle: 'Limited time offers worldwide',
    cta: 'Shop the Sale',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=400&fit=crop',
  },
]

export function Hero() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  const prev = () => setActive((i) => (i === 0 ? slides.length - 1 : i - 1))
  const next = () => setActive((i) => (i === slides.length - 1 ? 0 : i + 1))

  return (
    <section className="hero">
      <div className="container hero__wrap">
        <div className="hero__banner">
          <img src={slide.image} alt="" className="hero__banner-img" />
          <div className="hero__overlay" />
          <div className="hero__caption">
            <h1>{slide.title}</h1>
            <p>{slide.subtitle}</p>
            <button type="button" className="btn btn--primary btn--hero">
              {slide.cta}
            </button>
          </div>

          <button type="button" className="hero__arrow hero__arrow--left" onClick={prev} aria-label="Previous slide">
            <ChevronLeftIcon />
          </button>
          <button type="button" className="hero__arrow hero__arrow--right" onClick={next} aria-label="Next slide">
            <ChevronRightIcon />
          </button>

          <div className="hero__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`hero__dot${i === active ? ' hero__dot--active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
