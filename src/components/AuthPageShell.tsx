import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'

type AuthPageShellProps = {
  title: string
  subtitle?: string
  fallbackBack?: string
  children: ReactNode
  otp?: boolean
  portal?: 'buyer' | 'seller'
}

export function AuthPageShell({
  title,
  subtitle,
  fallbackBack = '/',
  children,
  otp = false,
  portal,
}: AuthPageShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const resolvedPortal = portal ?? (location.pathname.startsWith('/buyer/') ? 'buyer' : 'seller')
  const portalLabel = resolvedPortal === 'buyer' ? 'Buyer Account' : 'Seller Central'

  const handleBack = () => {
    const historyState = window.history.state as { idx?: number } | null
    if (historyState?.idx && historyState.idx > 0) {
      navigate(-1)
      return
    }

    navigate(fallbackBack)
  }

  return (
    <section className="auth-page">
      <div className="auth-page__wrap">
        <button type="button" className="auth-page__back" onClick={handleBack}>
          ← Back
        </button>

        <div className="auth-page__brand">
          <Logo className="auth-page__logo" />
          <span className="auth-page__portal">{portalLabel}</span>
        </div>

        {otp ? (
          <div className="seller-otp-card auth-page__card">
            <header className="seller-login__header seller-login__header--center">
              <h1>{title}</h1>
              {subtitle ? <p className="seller-login__subtitle">{subtitle}</p> : null}
            </header>
            {children}
          </div>
        ) : (
          <div className="seller-login auth-page__card-wrap">
            <div className="seller-login__card auth-page__card">
              <header className="seller-login__header seller-login__header--center">
                <h1>{title}</h1>
                {subtitle ? <p className="seller-login__subtitle">{subtitle}</p> : null}
              </header>
              {children}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
