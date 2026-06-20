import { supabase } from './supabase'

export type PortalKey = 'buyer' | 'seller'

export type PortalVerificationResult =
  | { allowed: true; role?: string }
  | { allowed: false; message: string; redirectPath?: string; actualRole?: string }

export async function verifyLoginPortal(portal: PortalKey): Promise<PortalVerificationResult> {
  if (!supabase) {
    return { allowed: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('verify_login_portal', {
    p_portal: portal,
  })

  if (error || !data || typeof data !== 'object') {
    return { allowed: false, message: 'Unable to verify account portal.' }
  }

  const payload = data as {
    allowed?: boolean
    message?: string
    redirect_path?: string
    actual_role?: string
    role?: string
  }

  if (payload.allowed) {
    return { allowed: true, role: payload.role }
  }

  return {
    allowed: false,
    message: payload.message ?? 'This account cannot use this login page.',
    redirectPath: payload.redirect_path,
    actualRole: payload.actual_role,
  }
}
