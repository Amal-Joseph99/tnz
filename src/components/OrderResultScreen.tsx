import type { ReactNode } from 'react'

type OrderResultScreenProps = {
  variant: 'success' | 'failed'
  title: string
  message: string
  children?: ReactNode
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M14 25.5L21 32.5L34 18.5"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M17 17L31 31M31 17L17 31"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const CONFETTI = [
  { className: 'order-result__confetti--1' },
  { className: 'order-result__confetti--2' },
  { className: 'order-result__confetti--3' },
  { className: 'order-result__confetti--4' },
  { className: 'order-result__confetti--5' },
  { className: 'order-result__confetti--6' },
  { className: 'order-result__confetti--7' },
  { className: 'order-result__confetti--8' },
  { className: 'order-result__confetti--9' },
  { className: 'order-result__confetti--10' },
]

export function OrderResultScreen({ variant, title, message, children }: OrderResultScreenProps) {
  const isSuccess = variant === 'success'

  return (
    <section className={`order-result order-result--${variant}`}>
      <div className="order-result__inner">
        <div className="order-result__hero">
          {isSuccess && (
            <div className="order-result__celebration" aria-hidden="true">
              {CONFETTI.map((item) => (
                <span key={item.className} className={`order-result__confetti ${item.className}`} />
              ))}
            </div>
          )}

          <div className={`order-result__icon order-result__icon--${variant}`} aria-hidden="true">
            {isSuccess ? <SuccessIcon /> : <FailedIcon />}
          </div>
        </div>

        <h1 className="order-result__title">{title}</h1>
        <p className="order-result__message">{message}</p>
        {children}
      </div>
    </section>
  )
}
