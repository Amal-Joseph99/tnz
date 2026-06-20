import { supabase } from './supabase'

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase()
}

type OtpResult = { ok: true } | { ok: false; message: string }

export async function verifySignupOtp(email: string, token: string): Promise<OtpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const normalizedEmail = normalizeAuthEmail(email)

  const attempts = ['email', 'signup'] as const
  let lastMessage = 'Token has expired or is invalid'

  for (const type of attempts) {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type,
    })

    if (!error) {
      return { ok: true }
    }

    lastMessage = error.message
  }

  return { ok: false, message: lastMessage }
}

export async function resendSignupOtp(email: string): Promise<OtpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const normalizedEmail = normalizeAuthEmail(email)
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function sendPasswordResetOtp(email: string): Promise<OtpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const normalizedEmail = normalizeAuthEmail(email)
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function verifyRecoveryOtp(email: string, token: string): Promise<OtpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const normalizedEmail = normalizeAuthEmail(email)
  const { error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: 'recovery',
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function updateAuthenticatedPassword(password: string): Promise<OtpResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
