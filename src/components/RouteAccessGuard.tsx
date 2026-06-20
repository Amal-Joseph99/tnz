import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { resolveRouteAccess } from '../lib/routeAccess'

type RouteAccessGuardProps = {
  children: ReactNode
}

export function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const location = useLocation()
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')
  const [redirectPath, setRedirectPath] = useState('/')

  useEffect(() => {
    let active = true

    void resolveRouteAccess(location.pathname).then((result) => {
      if (!active) return

      if (result.allowed) {
        setStatus('allowed')
        return
      }

      setRedirectPath(result.redirectPath ?? '/')
      setStatus('denied')
    })

    return () => {
      active = false
    }
  }, [location.pathname])

  if (status === 'loading') {
    return <div className="auth-gate-loading">Checking access...</div>
  }

  if (status === 'denied') {
    return <Navigate to={redirectPath} replace state={{ accessDenied: true }} />
  }

  return <>{children}</>
}
