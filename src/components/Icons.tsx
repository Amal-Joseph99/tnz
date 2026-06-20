type IconProps = { className?: string }

export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  )
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 2h2l2.5 12h11l2-8H6" />
    </svg>
  )
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7-4.5-9.5-9C1 8 3 5 6 5c2 0 3 1.5 4 3 1-1.5 2-3 4-3 3 0 5 3 3.5 7C19 16.5 12 21 12 21z" />
    </svg>
  )
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  )
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" />
    </svg>
  )
}

export function ReturnIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0115-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function HeadsetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14v-2a8 8 0 0116 0v2" />
      <rect x="2" y="14" width="5" height="6" rx="2" />
      <rect x="17" y="14" width="5" height="6" rx="2" />
    </svg>
  )
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </svg>
  )
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function LocationIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-6-5.4-6-10a6 6 0 1112 0c0 4.6-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CategoryIcon({ icon }: { icon: string }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }

  switch (icon) {
    case 'luggage':
      return (
        <svg {...props}>
          <rect x="7" y="6" width="10" height="14" rx="2" />
          <path d="M10 6V4h4v2M10 10v6M14 10v6M9 20v2M15 20v2" />
        </svg>
      )
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 11l8-7 8 7" />
          <path d="M6 10v10h12V10M10 20v-6h4v6" />
        </svg>
      )
    case 'fashion':
      return (
        <svg {...props}>
          <path d="M6 7h12M12 7V5a2 2 0 10-2-2" />
          <path d="M12 7L5 19h14L12 7z" />
        </svg>
      )
    case 'beauty':
      return (
        <svg {...props}>
          <path d="M8 12h5v8H8zM9 12V8h3v4M10.5 5v3" />
          <path d="M16 9l3-3M17 6l2 2M16 12h4v8h-4z" />
        </svg>
      )
    case 'electronics':
      return (
        <svg {...props}>
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="2" y="14" width="5" height="6" rx="2" />
          <rect x="17" y="14" width="5" height="6" rx="2" />
        </svg>
      )
    case 'combo':
      return (
        <svg {...props}>
          <rect x="5" y="10" width="14" height="10" rx="1" />
          <path d="M12 10v10M5 14h14M8 10c-2-2-1-5 1-5 2 0 3 5 3 5M16 10c2-2 1-5-1-5-2 0-3 5-3 5" />
        </svg>
      )
    case 'others':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      )
    case 'grocery':
      return (
        <svg {...props}>
          <path d="M5 10h14l-2 9H7l-2-9zM9 10a3 3 0 016 0" />
          <path d="M8 14h8M10 17h4" />
        </svg>
      )
    case 'dress':
      return (
        <svg {...props}>
          <path d="M8 4l-2 4v12h12V8l-2-4H8z" />
          <path d="M8 4h8M12 4v4" />
        </svg>
      )
    case 'shirt':
      return (
        <svg {...props}>
          <path d="M8 4l-4 4 2 2 2-1v13h8V9l2 1 2-2-4-4H8z" />
        </svg>
      )
    case 'headphones':
      return (
        <svg {...props}>
          <path d="M4 14v-2a8 8 0 0116 0v2" />
          <rect x="2" y="14" width="5" height="6" rx="2" />
          <rect x="17" y="14" width="5" height="6" rx="2" />
        </svg>
      )
    case 'chair':
      return (
        <svg {...props}>
          <rect x="5" y="10" width="14" height="8" rx="1" />
          <path d="M7 10V6a2 2 0 012-2h6a2 2 0 012 2v4" />
          <path d="M5 18v3M19 18v3" />
        </svg>
      )
    case 'perfume':
      return (
        <svg {...props}>
          <rect x="9" y="10" width="6" height="10" rx="1" />
          <path d="M10 10V7h4v3M12 4v3" />
        </svg>
      )
    case 'basketball':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3v18M5 5c4 4 10 4 14 0M5 19c4-4 10-4 14 0" />
        </svg>
      )
    default:
      return null
  }
}
