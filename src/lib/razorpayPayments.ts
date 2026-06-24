import { supabase } from './supabase'
import type { CheckoutCartItem, CheckoutDelivery } from './marketplaceOrders'
import type { ShippingQuote } from './shiprocketShipping'

type CreateCheckoutInput = {
  sellerUserId: string
  currencyCode: string
  subtotal: number
  shippingAmount: number
  codChargesAmount: number
  totalAmount: number
  delivery: CheckoutDelivery
  shippingQuote: ShippingQuote
  items: CheckoutCartItem[]
}

type CreateOrderResponse = {
  ok: true
  order_id: string
  amount: number
  currency: string
  orderId: number
  orderNumber: string
  key_id: string
}

type VerifyPaymentResponse = {
  ok: true
  success: true
  orderNumber: string
  orderId: number
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayFailedResponse = {
  error?: {
    description?: string
    reason?: string
  }
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', handler: (response: RazorpayFailedResponse) => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance
  }
}

async function invokeRazorpayFunction<T>(functionName: string, body: unknown): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body: body as Record<string, unknown> })
  if (error) {
    const serverMessage = data && typeof data === 'object' && 'error' in data
      ? String((data as { error: string }).error)
      : error.message
    throw new Error(serverMessage)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string') {
    throw new Error((data as { error: string }).error)
  }

  return data as T
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }

    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'))
    document.body.appendChild(script)
  })
}

function buildCheckoutPayload(input: CreateCheckoutInput) {
  return {
    sellerUserId: input.sellerUserId,
    currencyCode: input.currencyCode,
    subtotal: input.subtotal,
    shippingAmount: input.shippingAmount,
    codChargesAmount: input.codChargesAmount,
    totalAmount: input.totalAmount,
    delivery: {
      fullName: input.delivery.fullName,
      phone: input.delivery.phone,
      email: input.delivery.email,
      addressLine1: input.delivery.addressLine1,
      addressLine2: input.delivery.addressLine2,
      city: input.delivery.city,
      state: input.delivery.state,
      postcode: input.delivery.postcode,
      countryIso2: input.delivery.countryIso2,
    },
    shippingQuote: {
      weightKg: input.shippingQuote.weightKg,
      lengthCm: input.shippingQuote.lengthCm,
      widthCm: input.shippingQuote.widthCm,
      heightCm: input.shippingQuote.heightCm,
      courierCompanyId: input.shippingQuote.courierCompanyId,
      courierName: input.shippingQuote.courierName,
      estimatedDelivery: input.shippingQuote.estimatedDelivery,
      codAvailable: input.shippingQuote.codAvailable,
    },
    items: input.items.map((item) => ({
      productId: item.productId,
      sellerUserId: item.sellerUserId,
      sku: item.sku,
      title: item.title,
      brand: item.brand,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      variantId: item.variantId,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
    })),
  }
}

export async function startRazorpayCheckout(input: CreateCheckoutInput) {
  await loadRazorpayScript()

  const createResult = await invokeRazorpayFunction<CreateOrderResponse>(
    'razorpay-create-order',
    buildCheckoutPayload(input),
  )

  if (!createResult.key_id?.trim()) {
    throw new Error('Razorpay is not configured.')
  }

  return new Promise<VerifyPaymentResponse>((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: createResult.key_id,
      amount: createResult.amount,
      currency: createResult.currency,
      order_id: createResult.order_id,
      name: 'AGTRENZ',
      description: `Order ${createResult.orderNumber}`,
      prefill: {
        name: input.delivery.fullName,
        email: input.delivery.email,
        contact: input.delivery.phone,
      },
      handler: (response) => {
        void invokeRazorpayFunction<VerifyPaymentResponse>('razorpay-verify-payment', {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
          .then(resolve)
          .catch(reject)
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled.'))
        },
      },
    })

    checkout.on('payment.failed', (response) => {
      reject(new Error(response.error?.description ?? response.error?.reason ?? 'Payment failed.'))
    })

    checkout.open()
  })
}
