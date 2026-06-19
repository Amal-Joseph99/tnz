export const OTP_LENGTH = 6

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPassword(password: string) {
  return password.length >= 8
}

export function isValidPhone(phone: string) {
  return /^\+?[0-9\s-]{7,15}$/.test(phone.trim())
}

export function getOtpValue(otp: string[]) {
  return otp.join('')
}

export function isValidOtp(otp: string[]) {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(getOtpValue(otp))
}
