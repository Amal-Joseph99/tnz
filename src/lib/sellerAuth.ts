import { supabase } from './supabase'

export type StaffRole = 'admin' | 'seller'

type SellerLoginResult =
  | { ok: true; role: StaffRole }
  | { ok: false; message: string }

async function signOutSilently() {
  if (supabase) {
    await supabase.auth.signOut()
  }
}

export async function signInSellerOrAdmin(email: string, password: string): Promise<SellerLoginResult> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (signInError) {
    return { ok: false, message: signInError.message }
  }

  const { data: isBuyer, error: buyerError } = await supabase.rpc('is_buyer_account')
  if (!buyerError && isBuyer) {
    await signOutSilently()
    return {
      ok: false,
      message: 'This is a buyer account. Please use Buyer login at /buyer/signin.',
    }
  }

  const { data, error: roleError } = await supabase.rpc('get_staff_role')

  if (roleError) {
    await signOutSilently()
    return { ok: false, message: 'Unable to verify account role. Please contact support.' }
  }

  const role = typeof data === 'string' ? data : null

  if (role === 'admin') {
    return { ok: true, role: 'admin' }
  }

  if (role === 'seller') {
    return { ok: true, role: 'seller' }
  }

  await signOutSilently()
  return { ok: false, message: 'This account is not authorized for seller or admin access.' }
}
