export const stripeCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

export function stripeJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...stripeCorsHeaders, 'Content-Type': 'application/json' },
  })
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
])

export function toStripeMinorAmount(amount: number, currencyCode: string) {
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

export function getStripeClient() {
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY secret.')
  }

  return {
    secretKey,
    async request(path: string, init: RequestInit = {}) {
      const response = await fetch(`https://api.stripe.com/v1${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          ...(init.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
          ...(init.headers ?? {}),
        },
      })

      const payload = await response.json()
      if (!response.ok) {
        const message = typeof payload?.error?.message === 'string'
          ? payload.error.message
          : `Stripe request failed (${response.status}).`
        throw new Error(message)
      }

      return payload
    },
  }
}

export function encodeFormBody(values: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params.toString()
}

export function getCheckoutSiteUrl(fallbackOrigin?: string | null) {
  const configured = Deno.env.get('SITE_URL') ?? Deno.env.get('VITE_SITE_URL')
  if (configured?.trim()) {
    return configured.trim().replace(/\/$/, '')
  }
  if (fallbackOrigin?.trim()) {
    return fallbackOrigin.trim().replace(/\/$/, '')
  }
  throw new Error('Missing SITE_URL secret for Stripe redirect URLs.')
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
) {
  if (!signatureHeader) {
    throw new Error('Missing Stripe signature header.')
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key, value]
    }),
  ) as Record<string, string>

  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) {
    throw new Error('Invalid Stripe signature header.')
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  if (expected !== signature) {
    throw new Error('Stripe webhook signature verification failed.')
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (ageSeconds > 300) {
    throw new Error('Stripe webhook timestamp is too old.')
  }

  return JSON.parse(rawBody) as Record<string, unknown>
}
