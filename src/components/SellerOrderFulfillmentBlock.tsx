import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrderItemPackingSpecs, type OrderItemPackingSpec } from '../lib/orderPackingSpecs'
import {
  isSellerShippingLabelReady,
  SELLER_LABEL_GENERATING_MESSAGE,
  showSellerOrderFulfillment,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
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
  const labelReady = isSellerShippingLabelReady(order)
  const isPacked = ['packed', 'shipped', 'delivered'].includes(order.status)
  const showLabelNotice = showFulfillment && !labelReady && !isPacked

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

  if (!showFulfillment) return null

  return (
    <div className={`seller-order-fulfillment-block${compact ? ' seller-order-fulfillment-block--compact' : ''}`}>
      {showLabelNotice ? (
        <div className="seller-order-notice-dialog" role="status" aria-live="polite">
          <h4>Shipping label</h4>
          <p>{SELLER_LABEL_GENERATING_MESSAGE}</p>
        </div>
      ) : null}

      {packingSpecs.length > 0 ? (
        <article className="seller-order-packing-card">
          <h4>Packing recommendation</h4>
          <ul className="seller-order-packing-card__list">
            {packingSpecs.map((spec) => (
              <li key={`${spec.productId}-${spec.productName}`}>
                <strong>{spec.productName}</strong>
                {spec.quantity > 1 ? <span> × {spec.quantity}</span> : null}
                <div>Weight: {spec.weightLabel}</div>
                <div>Dimensions (L × W × H): {spec.dimensionsLabel}</div>
              </li>
            ))}
          </ul>
          <p className="seller-order-packing-card__warning">
            Packed weight and dimensions must not exceed the listed weight and L × W × H above.
          </p>
        </article>
      ) : null}

      <SellerOrderFulfillmentActions
        order={order}
        compact={compact}
        onOrderUpdated={onOrderUpdated}
        onError={onError}
        onMessage={onMessage}
      />

      <Link to="/seller/how-to-pack" className="seller-secondary-action seller-order-how-to-pack">
        How to pack
      </Link>
    </div>
  )
}
