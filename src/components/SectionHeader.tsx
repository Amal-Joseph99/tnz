import { Link } from 'react-router-dom'

type SectionHeaderProps = {
  title: string
  linkText?: string
  badge?: string
  linkTo?: string
}

export function SectionHeader({ title, linkText = 'See More', badge, linkTo = '/sale' }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      <div className="section-header__actions">
        {badge && <span className="section-header__badge">{badge}</span>}
        <Link to={linkTo} className="section-header__link">
          {linkText} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  )
}
