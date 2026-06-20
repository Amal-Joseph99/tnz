import { supabase } from './supabase'
import type { CheckoutCartItem, CheckoutDelivery } from './marketplaceOrders'
import type { ShippingQuote } from './shiprocketShipping'

type CreateCheckoutInput = {
  sellerUserId: string
  currencyCode: string
  subtotal: number
  shippingAmount: number
  codChargesAmount: number
  taxAmount: number
  totalAmount: number
  delivery: CheckoutDelivery
  shippingQuote: ShippingQuote
  items: CheckoutCartItem[]
}

type CreateCheckoutResponse = {
  ok: true
  orderId: number
  orderNumber: string
  sessionId: string
  checkoutUrl: string
}

async function invokeStripeFunction<T>(functionName: string, body: unknown): Promise<T> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.functions.invoke(functionName, { body: body as Record<string, unknown> })
  if (error) {
    throw new Error(error.message)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string') {
    throw new Error((data as { error: string }).error)
  }

  return data as T
}

export async function startStripeCheckout(input: CreateCheckoutInput) {
  const result = await invokeStripeFunction<CreateCheckoutResponse>('stripe-create-checkout', {
    sellerUserId: input.sellerUserId,
    currencyCode: input.currencyCode,
    subtotal: input.subtotal,
    shippingAmount: input.shippingAmount,
    codChargesAmount: input.codChargesAmount,
    taxAmount: input.taxAmount,
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
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      variantId: item.variantId,
    })),
  })

  if (!result.checkoutUrl) {
    throw new Error('Stripe checkout URL was not returned.')
  }

  return result
}

export async function fetchStripeCheckoutStatus(sessionId: string) {
  return invokeStripeFunction<{
    ok: true
    paid: boolean
    orderNumber: string
    orderStatus: string
    paymentStatus: string
    stripePaymentStatus: string
  }>('stripe-checkout-status', { sessionId })
}
