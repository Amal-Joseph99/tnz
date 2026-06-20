import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthPageShellProps = {
  title: string
  subtitle?: string
  backTo: string
  children: ReactNode
  otp?: boolean
}

export function AuthPageShell({ title, subtitle, backTo, children, otp = false }: AuthPageShellProps) {
  const pageClass = otp ? 'seller-otp-page auth-page' : 'seller-login-page auth-page'

  return (
    <section className={pageClass}>
      <div className="auth-page__wrap">
        <Link to={backTo} className="auth-page__back">
          ← Back
        </Link>
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
