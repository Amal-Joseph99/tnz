import { finalizeSignupEmailDelivery, normalizeAuthEmail } from './authOtp'
import { absoluteUrl } from './site'
import { supabase } from './supabase'
import { verifyLoginPortal } from './portalAuth'

export type AccountType = 'buyer' | 'seller' | 'admin' | 'unknown'

export type BuyerAuthResult =
  | { ok: true }
  | { ok: false; message: string }

export type StaffAuthResult =
  | { ok: true; role: 'admin' | 'seller' }
  | { ok: false; message: string }

export type BuyerSignUpResult =
  | { ok: true }
  | { ok: false; message: string }

async function signOutSilently() {
  if (supabase) {
    await supabase.auth.signOut()
  }
}

export async function signInBuyer(email: string, password: string): Promise<BuyerAuthResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (signInError) {
    return { ok: false, message: signInError.message }
  }

  const portalCheck = await verifyLoginPortal('buyer')
  if (!portalCheck.allowed) {
    await signOutSilently()
    return { ok: false, message: portalCheck.message }
  }

  return { ok: true }
}

export async function signUpBuyer(fullName: string, email: string, password: string): Promise<BuyerSignUpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  }

  const normalizedEmail = normalizeAuthEmail(email)

  const { data: eligibility, error: eligibilityError } = await supabase.rpc(
    'check_portal_email_registration',
    { p_portal: 'buyer', p_email: normalizedEmail },
  )

  if (eligibilityError) {
    return { ok: false, message: eligibilityError.message }
  }

  if (eligibility && eligibility.allowed === false) {
    return { ok: false, message: String(eligibility.message ?? 'This email cannot be used for buyer signup.') }
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: absoluteUrl('/buyer/verify-email'),
      data: {
        account_type: 'buyer',
        full_name: fullName.trim(),
      },
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  const deliveryResult = await finalizeSignupEmailDelivery(normalizedEmail, '/buyer/verify-email', data.user)
  if (!deliveryResult.ok) {
    return deliveryResult
  }

  return { ok: true }
}

export async function resolveAccountType(): Promise<AccountType> {
  if (!supabase) {
    return 'unknown'
  }

  const { data, error } = await supabase.rpc('get_account_type')
  if (error || !data) {
    return 'unknown'
  }

  if (data === 'buyer' || data === 'seller' || data === 'admin') {
    return data
  }

  return 'unknown'
}
