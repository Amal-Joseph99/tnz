import { useState } from 'react'
import {
  canSellerMarkOrderPacked,
  isSellerShippingLabelReady,
  sellerMarkOrderPacked,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { fetchShipmentDocument } from '../lib/shiprocketShipping'
import { SellerLabelGeneratingDialog } from './SellerLabelGeneratingDialog'

type SellerOrderFulfillmentActionsProps = {
  order: MarketplaceOrderRow
  onOrderUpdated: () => Promise<void>
  onError: (message: string) => void
  onMessage: (message: string) => void
  compact?: boolean
}

export function SellerOrderFulfillmentActions({
  order,
  onOrderUpdated,
  onError,
  onMessage,
  compact = false,
}: SellerOrderFulfillmentActionsProps) {
  const [downloadingLabel, setDownloadingLabel] = useState(false)
  const [markingPacked, setMarkingPacked] = useState(false)
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)

  const labelReady = isSellerShippingLabelReady(order)
  const canPack = canSellerMarkOrderPacked(order)
  const isPacked = ['packed', 'shipped', 'delivered'].includes(order.status)

  const downloadLabel = async () => {
    if (!labelReady) {
      setLabelDialogOpen(true)
      return
    }

    setDownloadingLabel(true)
    onError('')
    try {
      const result = await fetchShipmentDocument(order.id, 'label')
      if (!result.labelUrl) {
        setLabelDialogOpen(true)
        return
      }
      window.open(result.labelUrl, '_blank', 'noopener,noreferrer')
      onMessage('Label ready.')
      await onOrderUpdated()
    } catch {
      setLabelDialogOpen(true)
    } finally {
      setDownloadingLabel(false)
    }
  }

  const markPacked = async () => {
    if (isPacked) return

    if (!labelReady || !canPack) {
      setLabelDialogOpen(true)
      return
    }

    setMarkingPacked(true)
    onError('')
    const result = await sellerMarkOrderPacked(order.id)
    setMarkingPacked(false)
    if (!result.ok) {
      onError(result.message)
      return
    }
    onMessage('Order marked packed.')
    await onOrderUpdated()
  }

  return (
    <>
      <div className={`seller-order-fulfillment${compact ? ' seller-order-fulfillment--compact' : ''}`}>
        <div className="seller-order-fulfillment__actions">
          <button
            type="button"
            className="seller-order-fulfillment__download"
            disabled={downloadingLabel}
            onClick={() => void downloadLabel()}
          >
            {downloadingLabel ? 'Preparing label…' : 'Download label'}
          </button>
          <button
            type="button"
            className="admin-accept"
            disabled={isPacked || markingPacked}
            onClick={() => void markPacked()}
          >
            {markingPacked ? 'Updating…' : isPacked ? 'Order packed' : 'Order Packed'}
          </button>
        </div>
      </div>

      <SellerLabelGeneratingDialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} />
    </>
  )
}
