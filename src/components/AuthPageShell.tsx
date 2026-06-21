import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthBentoGrid } from './auth/AuthBentoGrid'
import { Logo } from './Logo'

type AuthPageShellProps = {
  title?: string
  subtitle?: string
  fallbackBack?: string
  children: ReactNode
  footer?: ReactNode
  otp?: boolean
  portal?: 'buyer' | 'seller'
  showBento?: boolean
}

export function AuthPageShell({
  title,
  subtitle,
  fallbackBack = '/',
  children,
  footer,
  otp = false,
  portal,
  showBento = true,
}: AuthPageShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const resolvedPortal = portal ?? (location.pathname.startsWith('/buyer/') ? 'buyer' : 'seller')
  const lead =
    subtitle ??
    (resolvedPortal === 'buyer'
      ? 'Sign in with your email to continue'
      : 'Sign in with your seller email to continue')

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
      <button type="button" className="auth-page__back" onClick={handleBack}>
        ← Back
      </button>

      <div className="auth-page__layout">
        {showBento ? <AuthBentoGrid /> : null}

        <div className={`auth-page__panel${otp ? ' auth-page__panel--otp' : ''}`}>
          <div className="auth-page__brand">
            <Logo className="auth-page__logo" />
          </div>

          {title ? <h1 className="auth-page__title">{title}</h1> : null}
          <p className="auth-page__lead">{lead}</p>

          <div className="auth-page__content">{children}</div>

          {footer ? <div className="auth-page__footer">{footer}</div> : null}
        </div>
      </div>
    </section>
  )
}
