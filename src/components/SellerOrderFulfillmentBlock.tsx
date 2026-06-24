import { useEffect, useMemo, useState } from 'react'
import { fetchOrderItemPackingSpecs, type OrderItemPackingSpec } from '../lib/orderPackingSpecs'
import { showSellerOrderFulfillment, type MarketplaceOrderRow } from '../lib/marketplaceOrders'
import { SellerOrderFulfillmentActions } from './SellerOrderFulfillmentActions'

type SellerOrderFulfillmentBlockProps = {
  order: MarketplaceOrderRow
  onOrderUpdated: () => Promise<void>
  onError: (message: string) => void
  onMessage: (message: string) => void
  compact?: boolean
}

export function SellerOrderFulfillmentBlock({
  order,
  onOrderUpdated,
  onError,
  onMessage,
  compact = false,
}: SellerOrderFulfillmentBlockProps) {
  const [packingSpecs, setPackingSpecs] = useState<OrderItemPackingSpec[]>([])

  const showFulfillment = showSellerOrderFulfillment(order)

  useEffect(() => {
    if (!showFulfillment) {
      setPackingSpecs([])
      return
    }

    let active = true
    void fetchOrderItemPackingSpecs(order).then((rows) => {
      if (active) setPackingSpecs(rows)
    })

    return () => {
      active = false
    }
  }, [order, showFulfillment])

  const packingLines = useMemo(() => {
    if (packingSpecs.length === 0) return null

    const primary = packingSpecs[0]
    return {
      weight: primary.weightLabel,
      dimensions: primary.dimensionsLabel,
    }
  }, [packingSpecs])

  if (!showFulfillment) return null

  return (
    <div className={`seller-order-fulfillment-block${compact ? ' seller-order-fulfillment-block--compact' : ''}`}>
      {packingLines ? (
        <div className="seller-order-packing-compact">
          <div>Weight: {packingLines.weight}</div>
          <div>Dimensions: {packingLines.dimensions}</div>
          <p className="seller-order-packing-compact__warning">
            Do not exceed listed weight and L × W × H when packing.
          </p>
        </div>
      ) : null}

      <SellerOrderFulfillmentActions
        order={order}
        compact={compact}
        onOrderUpdated={onOrderUpdated}
        onError={onError}
        onMessage={onMessage}
      />
    </div>
  )
}
