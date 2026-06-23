import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SellerProductConfirmDialog } from '../components/SellerProductConfirmDialog'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { useCurrency } from '../context/CurrencyContext'
import {
  fetchOrderProductThumbnails,
  fetchSellerOrder,
  formatOrderStatus,
  formatPaymentMethod,
  getShipmentRow,
  sellerMarkOrderPacked,
  sellerRespondToOrder,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { sellerFetchShipmentDocuments } from '../lib/shiprocketShipping'

type ConfirmState = {
  action: 'accept' | 'reject'
} | null

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

export function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const { formatPrice } = useCurrency()
  const [order, setOrder] = useState<MarketplaceOrderRow | null>(null)
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [responding, setResponding] = useState(false)

  const parsedOrderId = Number(orderId)

  const loadOrder = async () => {
    if (!Number.isFinite(parsedOrderId)) {
      setOrder(null)
      return
    }

    const row = await fetchSellerOrder(parsedOrderId)
    setOrder(row)

    if (row?.marketplace_order_items?.length) {
      const productIds = row.marketplace_order_items.map((item) => item.product_id)
      setThumbnails(await fetchOrderProductThumbnails(productIds))
    }
  }

  useEffect(() => {
    void loadOrder().finally(() => setLoading(false))
  }, [parsedOrderId])

  const handleConfirm = async () => {
    if (!order || !confirmState) return

    setResponding(true)
    setError('')
    setMessage('')

    const result = await sellerRespondToOrder(order.id, confirmState.action === 'accept')
    setResponding(false)
    setConfirmState(null)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(confirmState.action === 'accept' ? 'Order accepted.' : 'Order rejected.')
    await loadOrder()
  }

  const downloadDocs = async () => {
    if (!order) return
    setError('')
    try {
      const result = await sellerFetchShipmentDocuments(order.id)
      if (result.labelUrl) window.open(result.labelUrl, '_blank', 'noopener,noreferrer')
      if (result.manifestUrl) window.open(result.manifestUrl, '_blank', 'noopener,noreferrer')
      setMessage('Label and manifest ready.')
      await loadOrder()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch documents.')
    }
  }

  const markPacked = async () => {
    if (!order) return
    setError('')
    const result = await sellerMarkOrderPacked(order.id)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Order marked packed.')
    await loadOrder()
  }

  if (loading) {
    return (
      <SellerDashboardShell>
        <p>Loading order...</p>
      </SellerDashboardShell>
    )
  }

  if (!order) {
    return (
      <SellerDashboardShell>
        <section className="seller-console-card">
          <h2>Order not found</h2>
          <p>This confirmed order is unavailable or you do not have access.</p>
          <Link to="/seller/orders" className="admin-btn admin-btn--ghost">Back to orders</Link>
        </section>
      </SellerDashboardShell>
    )
  }

  const shipment = getShipmentRow(order)
  const canRespond = order.status === 'pending_seller_acceptance'
  const addressLines = [
    order.delivery_address_line1,
    order.delivery_address_line2,
    `${order.delivery_city}, ${order.delivery_state} ${order.delivery_postcode}`,
    order.delivery_country_iso2,
  ].filter(Boolean)

  return (
    <SellerDashboardShell>
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="seller-console-card seller-order-detail">
        <div className="seller-console-card__header">
          <div>
            <Link to="/seller/orders" className="seller-order-detail__back">← Back to orders</Link>
            <h2>{order.order_number}</h2>
            <p>{formatOrderStatus(order.status)}</p>
          </div>
          {canRespond && (
            <div className="seller-order-detail__header-actions">
              <button type="button" className="admin-accept" onClick={() => setConfirmState({ action: 'accept' })}>
                Accept
              </button>
              <button type="button" className="admin-reject" onClick={() => setConfirmState({ action: 'reject' })}>
                Reject
              </button>
            </div>
          )}
        </div>

        <div className="seller-order-detail__grid">
          <article className="seller-order-detail__card">
            <h3>Buyer details</h3>
            <dl>
              <div><dt>Name</dt><dd>{order.delivery_full_name}</dd></div>
              <div><dt>Phone</dt><dd>{order.delivery_phone}</dd></div>
              <div><dt>Email</dt><dd>{order.delivery_email}</dd></div>
            </dl>
          </article>

          <article className="seller-order-detail__card">
            <h3>Delivery address</h3>
            <address>
              {addressLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </article>

          <article className="seller-order-detail__card">
            <h3>Payment & shipping</h3>
            <dl>
              <div><dt>Payment</dt><dd>{formatPaymentMethod(order.payment_method)}</dd></div>
              <div><dt>Courier</dt><dd>{order.shipping_courier_name ?? '—'}</dd></div>
              <div><dt>Expected delivery</dt><dd>{order.shipping_estimated_delivery ?? '—'}</dd></div>
              <div><dt>Placed on</dt><dd>{new Date(order.created_at).toLocaleString()}</dd></div>
            </dl>
          </article>
        </div>

        <div className="seller-order-detail__items">
          <h3>Items</h3>
          <div className="seller-order-detail__item-list">
            {order.marketplace_order_items?.map((item) => (
              <article key={`${item.product_id}-${item.sku}`} className="seller-order-detail__item">
                <img
                  src={thumbnails.get(item.product_id) ?? PRODUCT_PLACEHOLDER}
                  alt={item.product_name}
                  className="seller-order-detail__item-thumb"
                />
                <div>
                  <strong>{item.product_name}</strong>
                  <span>SKU: {item.sku}</span>
                  <span>Qty: {item.quantity}</span>
                </div>
                <strong>{formatPrice(item.line_total)}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="seller-order-detail__totals">
          <div><span>Subtotal</span><strong>{formatPrice(order.subtotal_amount)}</strong></div>
          <div><span>Shipping</span><strong>{formatPrice(order.shipping_amount)}</strong></div>
          {order.cod_charges_amount > 0 && (
            <div><span>COD charges</span><strong>{formatPrice(order.cod_charges_amount)}</strong></div>
          )}
          <div className="seller-order-detail__totals-total">
            <span>Total</span>
            <strong>{formatPrice(order.total_amount)}</strong>
          </div>
        </div>

        {shipment?.awb_code && (
          <p className="seller-order-detail__awb">AWB: {shipment.awb_code}</p>
        )}

        {['shiprocket_created', 'packed', 'shipped', 'delivered'].includes(order.status) && (
          <div className="seller-order-detail__fulfillment">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void downloadDocs()}>
              Label / manifest
            </button>
            {order.status === 'shiprocket_created' && (
              <button type="button" className="admin-accept" onClick={() => void markPacked()}>
                Mark packed
              </button>
            )}
          </div>
        )}

        {order.seller_response_note && (
          <p className="seller-order-detail__note">Seller note: {order.seller_response_note}</p>
        )}
      </section>

      <SellerProductConfirmDialog
        open={confirmState !== null}
        title={confirmState?.action === 'accept' ? 'Accept order' : 'Reject order'}
        message={
          confirmState?.action === 'accept'
            ? `Accept order ${order.order_number} from ${order.delivery_full_name}?`
            : `Reject order ${order.order_number} from ${order.delivery_full_name}? This cannot be undone.`
        }
        confirmLabel={confirmState?.action === 'accept' ? 'Accept order' : 'Reject order'}
        onCancel={() => {
          if (!responding) setConfirmState(null)
        }}
        onConfirm={() => void handleConfirm()}
      />
    </SellerDashboardShell>
  )
}
