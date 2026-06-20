import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type AuthPageShellProps = {
  title: string
  subtitle?: string
  fallbackBack?: string
  children: ReactNode
  otp?: boolean
}

export function AuthPageShell({
  title,
  subtitle,
  fallbackBack = '/',
  children,
  otp = false,
}: AuthPageShellProps) {
  const navigate = useNavigate()
  const pageClass = otp ? 'seller-otp-page auth-page' : 'seller-login-page auth-page'

  const handleBack = () => {
    const historyState = window.history.state as { idx?: number } | null
    if (historyState?.idx && historyState.idx > 0) {
      navigate(-1)
      return
    }

    navigate(fallbackBack)
  }

  return (
    <section className={pageClass}>
      <div className="auth-page__wrap">
        <button type="button" className="auth-page__back" onClick={handleBack}>
          ← Back
        </button>
        {otp ? (
          <div className="seller-otp-card">
            <header className="seller-login__header seller-login__header--center">
              <h1>{title}</h1>
              {subtitle ? <p className="seller-login__subtitle">{subtitle}</p> : null}
            </header>
            {children}
          </div>
        ) : (
          <div className="seller-login">
            <div className="seller-login__card">
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
