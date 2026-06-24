import { supabase } from './supabase'
import type { MarketplaceOrderRow } from './marketplaceOrders'

export type OrderItemPackingSpec = {
  productId: number
  productName: string
  quantity: number
  weightLabel: string
  dimensionsLabel: string
}

function formatUnitValue(value: number | null | undefined, unitCode: string | null | undefined, fallbackUnit: string) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  const unit = (unitCode ?? fallbackUnit).trim() || fallbackUnit
  return `${Number(value)} ${unit}`
}

export async function fetchOrderItemPackingSpecs(order: MarketplaceOrderRow): Promise<OrderItemPackingSpec[]> {
  const items = order.marketplace_order_items ?? []
  const productIds = [...new Set(items.map((item) => item.product_id).filter((id) => id > 0))]
  if (!supabase || productIds.length === 0) return []

  const { data, error } = await supabase
    .from('seller_products')
    .select(`
      id,
      product_name,
      weight_kg,
      package_length_cm,
      package_width_cm,
      package_height_cm,
      package_length_unit_code,
      package_width_unit_code,
      package_height_unit_code,
      package_weight_unit_code
    `)
    .in('id', productIds)

  if (error || !data) return []

  const byProductId = new Map(data.map((row) => [Number(row.id), row]))

  return items.map((item) => {
    const product = byProductId.get(item.product_id)
    const weightLabel = product
      ? formatUnitValue(
          product.weight_kg as number | null,
          product.package_weight_unit_code as string | null,
          'kg',
        )
      : '—'
    const length = product?.package_length_cm
    const width = product?.package_width_cm
    const height = product?.package_height_cm
    const dimensionsLabel = product
      ? `${formatUnitValue(length as number | null, product.package_length_unit_code as string | null, 'cm')} × ${formatUnitValue(width as number | null, product.package_width_unit_code as string | null, 'cm')} × ${formatUnitValue(height as number | null, product.package_height_unit_code as string | null, 'cm')}`
      : '—'

    return {
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      weightLabel,
      dimensionsLabel,
    }
  })
}
