import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveAccountType, type AccountType } from '../lib/buyerAuth'
import { fetchDialogMessage } from '../lib/appDialogs'
import { supabase } from '../lib/supabase'
import { useConfirmDialog } from './ConfirmDialogContext'

type AuthContextValue = {
  accountType: AccountType
  loading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  signOutWithConfirm: () => Promise<void>
  signOutFromConsole: () => Promise<void>
  refreshAccountType: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { confirmAction } = useConfirmDialog()
  const [accountType, setAccountType] = useState<AccountType>('unknown')
  const [loading, setLoading] = useState(true)

  const refreshAccountType = useCallback(async () => {
    if (!supabase) {
      setAccountType('unknown')
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      setAccountType('unknown')
      return
    }

    const type = await resolveAccountType()
    setAccountType(type)
  }, [])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!supabase) {
        if (active) {
          setLoading(false)
        }
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        if (active) {
          setAccountType('unknown')
          setLoading(false)
        }
        return
      }

      const type = await resolveAccountType()
      if (active) {
        setAccountType(type)
        setLoading(false)
      }
    }

    void bootstrap()

    if (!supabase) {
      return () => {
        active = false
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void refreshAccountType()
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [refreshAccountType])

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setAccountType('unknown')
  }, [])

  const signOutWithConfirm = useCallback(async () => {
    const confirmed = await confirmAction('sign_out')
    if (!confirmed) return
    await signOut()
    navigate('/buyer/signin')
  }, [confirmAction, navigate, signOut])

  const signOutFromConsole = useCallback(async () => {
    const confirmed = await confirmAction('console_sign_out')
    if (!confirmed) return

    const dialog = await fetchDialogMessage('console_sign_out')
    await signOut()
    navigate(dialog?.redirectPath ?? '/seller/signin')
  }, [confirmAction, navigate, signOut])

  const value = useMemo(
    () => ({
      accountType,
      loading,
      isSignedIn: accountType !== 'unknown',
      signOut,
      signOutWithConfirm,
      signOutFromConsole,
      refreshAccountType,
    }),
    [accountType, loading, refreshAccountType, signOut, signOutFromConsole, signOutWithConfirm],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
