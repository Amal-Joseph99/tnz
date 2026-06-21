import { Link } from 'react-router-dom'

type LogoProps = {
  className?: string
}

export function Logo({ className = 'header__logo' }: LogoProps) {
  return (
    <Link to="/" className={className} aria-label="AGTRENZ home">
      <img src="/logo.png" alt="AGTRENZ" className="site-logo" />
    </Link>
  )
}
