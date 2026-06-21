import { finalizeSignupEmailDelivery, normalizeAuthEmail } from './authOtp'
import { absoluteUrl } from './site'
import { supabase } from './supabase'
import { verifyLoginPortal } from './portalAuth'
import type { SellerCountryOption } from './sellerCountries'

export type StaffRole = 'admin' | 'seller'

type SellerLoginResult =
  | { ok: true; role: StaffRole }
  | { ok: false; message: string }

export type SellerSignUpInput = {
  businessName: string
  country: SellerCountryOption
  email: string
  phoneLocal: string
  password: string
}

export type SellerSignUpResult =
  | { ok: true }
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

  const portalCheck = await verifyLoginPortal('seller')
  if (!portalCheck.allowed) {
    await signOutSilently()
    return { ok: false, message: portalCheck.message }
  }

  const role = portalCheck.role === 'admin' ? 'admin' : 'seller'
  return { ok: true, role }
}

export async function signUpSeller(input: SellerSignUpInput): Promise<SellerSignUpResult> {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    }
  }

  const localDigits = input.phoneLocal.replace(/\D/g, '')
  const fullPhone = `+${input.country.isd_code}${localDigits}`
  const email = normalizeAuthEmail(input.email)

  const { data: eligibility, error: eligibilityError } = await supabase.rpc(
    'check_portal_email_registration',
    { p_portal: 'seller', p_email: email },
  )

  if (eligibilityError) {
    return { ok: false, message: eligibilityError.message }
  }

  if (eligibility && eligibility.allowed === false) {
    return { ok: false, message: String(eligibility.message ?? 'This email cannot be used for seller signup.') }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: absoluteUrl('/seller/verify-email'),
      data: {
        account_type: 'seller',
        business_name: input.businessName.trim(),
        country_id: input.country.id,
        iso_alpha2: input.country.iso_alpha2,
        iso_alpha3: input.country.iso_alpha3,
        isd_code: input.country.isd_code,
        base_currency_code: input.country.currency_code,
        phone: fullPhone,
      },
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  const deliveryResult = await finalizeSignupEmailDelivery(email, '/seller/verify-email', data.user)
  if (!deliveryResult.ok) {
    return deliveryResult
  }

  return { ok: true }
}

export async function ensureSellerRegistration(): Promise<SellerSignUpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('ensure_seller_registration')

  if (error) {
    return { ok: false, message: error.message }
  }

  if (!data || data.ok !== true) {
    return { ok: false, message: 'Seller account provisioning failed.' }
  }

  return { ok: true }
}
