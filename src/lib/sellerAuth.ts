import { supabase } from './supabase'

export type StaffRole = 'admin' | 'seller'

type SellerLoginResult =
  | { ok: true; role: StaffRole }
  | { ok: false; message: string }

export async function signInSellerOrAdmin(email: string, password: string): Promise<SellerLoginResult> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { ok: false, message: signInError.message }
  }

  const { data, error: roleError } = await supabase.rpc('get_staff_role')

  if (roleError) {
    return { ok: false, message: 'Unable to verify account role. Please contact support.' }
  }

  const role = typeof data === 'string' ? data : data?.role

  if (role === 'admin' || role === 'seller') {
    return { ok: true, role }
  }

  return { ok: false, message: 'This account is not authorized for seller or admin access.' }
}
