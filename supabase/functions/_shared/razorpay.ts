export const razorpayCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function razorpayJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...razorpayCorsHeaders, 'Content-Type': 'application/json' },
  })
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
])

export function toRazorpayMinorAmount(amount: number, currencyCode: string) {
  const currency = currencyCode.trim().toLowerCase()
  const normalized = Number(amount)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error('Order total must be greater than zero.')
  }

  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(normalized)
  }

  return Math.round(normalized * 100)
}

export function getRazorpayCredentials() {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID')
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay credentials.')
  }
  return { keyId, keySecret }
}

function getRazorpayAuthHeader(keyId: string, keySecret: string) {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`
}

export async function createRazorpayOrder(input: {
  amount: number
  currency: string
  receipt: string
}) {
  const { keyId, keySecret } = getRazorpayCredentials()

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: getRazorpayAuthHeader(keyId, keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      receipt: input.receipt,
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    const message = typeof payload?.error?.description === 'string'
      ? payload.error.description
      : `Razorpay request failed (${response.status}).`
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return payload as {
    id: string
    amount: number
    currency: string
  }
}

export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
) {
  const payload = `${orderId}|${paymentId}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return expected === signature
}
