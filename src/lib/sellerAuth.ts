import { supabase } from './supabase'
import { absoluteUrl } from './site'
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

  const { error } = await supabase.auth.signUp({
    email: input.email.trim(),
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

  return { ok: true }
}
