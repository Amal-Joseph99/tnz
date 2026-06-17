import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PageShellProps = {
  eyebrow?: string
  title: string
  subtitle: string
  children?: ReactNode
}

export function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <section className="simple-page">
      <div className="container simple-page__inner">
        <div className="simple-page__header">
          {eyebrow && <span>{eyebrow}</span>}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

type InfoGridProps = {
  items: Array<{ title: string; text: string }>
}

export function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className="info-grid">
      {items.map((item) => (
        <article key={item.title} className="info-card">
          <h2>{item.title}</h2>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  )
}

type FormPageProps = {
  eyebrow?: string
  title: string
  subtitle: string
  fields: Array<{ label: string; type: string; placeholder: string }>
  buttonText: string
  footer?: ReactNode
  onSubmit?: () => void
}

export function FormPage({ eyebrow, title, subtitle, fields, buttonText, footer, onSubmit }: FormPageProps) {
  return (
    <PageShell eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <form className="simple-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}>
        {fields.map((field) => (
          <label key={field.label}>
            {field.label}
            <input type={field.type} placeholder={field.placeholder} />
          </label>
        ))}
        <button type="submit">{buttonText}</button>
        {footer && <div className="simple-form__footer">{footer}</div>}
      </form>
    </PageShell>
  )
}

export function BackHomeLink() {
  return (
    <Link to="/" className="simple-page__back">
      Back to homepage
    </Link>
  )
}
