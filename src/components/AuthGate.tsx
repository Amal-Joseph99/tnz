import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageLoadingState } from './PageLoadingState'
import { resolveAccountType } from '../lib/buyerAuth'
import { supabase } from '../lib/supabase'

function useAuthGate(loginPath: string, isAllowed: (accountType: Awaited<ReturnType<typeof resolveAccountType>>) => boolean) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    let active = true

    async function verify() {
      if (!supabase) {
        if (active) {
          setStatus('denied')
        }
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        if (active) {
          setStatus('denied')
        }
        return
      }

      const accountType = await resolveAccountType()
      if (active) {
        setStatus(isAllowed(accountType) ? 'allowed' : 'denied')
      }
    }

    void verify()

    return () => {
      active = false
    }
  }, [loginPath])

  return status
}

function GateShell({ status, loginPath, children }: { status: 'loading' | 'allowed' | 'denied'; loginPath: string; children: ReactNode }) {
  if (status === 'loading') {
    return <PageLoadingState label="Checking access…" />
  }

  if (status === 'denied') {
    return <Navigate to={loginPath} replace />
  }

  return <>{children}</>
}

export function RequireBuyerAuth({ children }: { children: ReactNode }) {
  const status = useAuthGate('/buyer/signin', (type) => type === 'buyer')
  return <GateShell status={status} loginPath="/buyer/signin">{children}</GateShell>
}

export function RequireSellerAuth({ children }: { children: ReactNode }) {
  const status = useAuthGate('/seller/signin', (type) => type === 'seller')
  return <GateShell status={status} loginPath="/seller/signin">{children}</GateShell>
}

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const status = useAuthGate('/seller/signin', (type) => type === 'admin')
  return <GateShell status={status} loginPath="/seller/signin">{children}</GateShell>
}
