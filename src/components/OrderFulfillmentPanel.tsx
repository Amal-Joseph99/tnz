import { useState } from 'react'
import { SellerOrderFulfillmentActions } from './SellerOrderFulfillmentActions'
import {
  formatOrderStatus,
  getShipmentRow,
  showSellerOrderFulfillment,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import {
  adminAssignShiprocketShipment,
  adminSyncOrderToShiprocket,
  fetchShipmentDocument,
} from '../lib/shiprocketShipping'

type OrderFulfillmentPanelProps = {
  order: MarketplaceOrderRow
  mode: 'admin' | 'seller'
  formatListingPrice: (amount: number, currencyCode: string) => string
  onOrderUpdated: () => Promise<void>
  onError: (message: string) => void
  onMessage: (message: string) => void
}

export function OrderFulfillmentPanel({
  order,
  mode,
  formatListingPrice,
  onOrderUpdated,
  onError,
  onMessage,
}: OrderFulfillmentPanelProps) {
  const [syncing, setSyncing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [downloadingLabel, setDownloadingLabel] = useState(false)
  const [downloadingManifest, setDownloadingManifest] = useState(false)

  const shipment = getShipmentRow(order)
  const hasShiprocketShipment = Boolean(shipment?.shiprocket_shipment_id)
  const hasAwb = Boolean(shipment?.awb_code)
  const showCourierCard = Boolean(
    order.shipping_courier_name
    || order.status === 'seller_accepted'
    || order.status === 'shiprocket_pending'
    || hasAwb,
  )

  const canSync = mode === 'admin'
    && (order.status === 'seller_accepted' || order.status === 'shiprocket_pending')
    && !hasAwb
    && !hasShiprocketShipment

  const canAssign = mode === 'admin'
    && order.status === 'shiprocket_pending'
    && hasShiprocketShipment
    && !hasAwb
    && Boolean(order.shipping_courier_company_id)

  const canDownloadDocs = mode === 'admin'
    && ['shiprocket_created', 'packed', 'shipped', 'delivered'].includes(order.status)
    && hasAwb

  const showSellerFulfillment = mode === 'seller' && showSellerOrderFulfillment(order)

  const syncOrder = async () => {
    setSyncing(true)
    onError('')
    try {
      const result = await adminSyncOrderToShiprocket(order.id)
      onMessage(
        result.alreadySynced
          ? 'Order is already synced to Shiprocket.'
          : 'Order synced to Shiprocket dashboard.',
      )
      await onOrderUpdated()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to sync order to Shiprocket.')
    } finally {
      setSyncing(false)
    }
  }

  const createShipment = async () => {
    setAssigning(true)
    onError('')
    try {
      const result = await adminAssignShiprocketShipment(order.id)
      onMessage(
        result.alreadyAssigned
          ? `Shipment already created. AWB ${result.awbCode}`
          : `Shipment created. AWB ${result.awbCode}`,
      )
      await onOrderUpdated()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to create shipment.')
    } finally {
      setAssigning(false)
    }
  }

  const downloadDocument = async (documentType: 'label' | 'manifest') => {
    const setLoading = documentType === 'label' ? setDownloadingLabel : setDownloadingManifest
    setLoading(true)
    onError('')
    try {
      const result = await fetchShipmentDocument(order.id, documentType)
      const url = documentType === 'label' ? result.labelUrl : result.manifestUrl
      if (!url) {
        onError(`${documentType === 'label' ? 'Label' : 'Manifest'} is not available yet.`)
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      onMessage(`${documentType === 'label' ? 'Label' : 'Manifest'} ready.`)
      await onOrderUpdated()
    } catch (err) {
      onError(err instanceof Error ? err.message : `Unable to download ${documentType}.`)
    } finally {
      setLoading(false)
    }
  }

  if (!showCourierCard && !canSync && !canAssign && !canDownloadDocs && !showSellerFulfillment) {
    return null
  }

  const shippingTotal = Number(order.shipping_amount) + Number(order.cod_charges_amount ?? 0)

  return (
    <section className="order-fulfillment">
      <div className="order-fulfillment__header">
        <h3>Shiprocket fulfillment</h3>
        <span className="order-fulfillment__status">{formatOrderStatus(order.status)}</span>
      </div>

      {showCourierCard && (
        <article className="order-fulfillment__courier-card">
          <h4>Buyer-selected courier</h4>
          <dl>
            <div>
              <dt>Courier partner</dt>
              <dd>{order.shipping_courier_name ?? 'Not assigned'}</dd>
            </div>
            <div>
              <dt>Shipping rate</dt>
              <dd>{formatListingPrice(order.shipping_amount, order.currency_code)}</dd>
            </div>
            {order.cod_charges_amount > 0 && (
              <div>
                <dt>COD charges</dt>
                <dd>{formatListingPrice(order.cod_charges_amount, order.currency_code)}</dd>
              </div>
            )}
            <div>
              <dt>Total shipping</dt>
              <dd>{formatListingPrice(shippingTotal, order.currency_code)}</dd>
            </div>
            {order.shipping_estimated_delivery && (
              <div>
                <dt>Expected delivery</dt>
                <dd>{order.shipping_estimated_delivery}</dd>
              </div>
            )}
          </dl>
          {hasShiprocketShipment && !hasAwb && (
            <p className="order-fulfillment__hint">Order synced to Shiprocket. Create shipment to assign AWB.</p>
          )}
          {hasAwb && (
            <p className="order-fulfillment__hint">AWB: {shipment?.awb_code}</p>
          )}
        </article>
      )}

      {showSellerFulfillment ? (
        <SellerOrderFulfillmentActions
          order={order}
          onOrderUpdated={onOrderUpdated}
          onError={onError}
          onMessage={onMessage}
        />
      ) : (
        <div className="order-fulfillment__actions">
          {canSync && (
            <button type="button" className="admin-btn" disabled={syncing} onClick={() => void syncOrder()}>
              {syncing ? 'Syncing…' : 'Sync to Shiprocket'}
            </button>
          )}
          {canAssign && (
            <button type="button" className="admin-btn" disabled={assigning} onClick={() => void createShipment()}>
              {assigning ? 'Creating shipment…' : 'Create shipment'}
            </button>
          )}
          {canDownloadDocs && (
            <>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={downloadingLabel}
                onClick={() => void downloadDocument('label')}
              >
                {downloadingLabel ? 'Preparing label…' : 'Download label'}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={downloadingManifest}
                onClick={() => void downloadDocument('manifest')}
              >
                {downloadingManifest ? 'Preparing manifest…' : 'Download manifest'}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
