import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SellerProductConfirmDialog } from '../components/SellerProductConfirmDialog'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { OrderFulfillmentPanel } from '../components/OrderFulfillmentPanel'
import { useCurrency } from '../context/CurrencyContext'
import {
  fetchOrderProductThumbnails,
  fetchSellerOrder,
  formatOrderStatus,
  formatPaymentMethod,
  sellerRespondToOrder,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { formatOrderItemVariantLabel } from '../lib/variantDisplay'

type ConfirmState = {
  action: 'accept' | 'reject'
} | null

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

export function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const { formatListingPrice } = useCurrency()
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

        <OrderFulfillmentPanel
          order={order}
          mode="seller"
          formatListingPrice={formatListingPrice}
          onOrderUpdated={loadOrder}
          onError={setError}
          onMessage={setMessage}
        />

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
                  {item.brand_name && <span>{item.brand_name}</span>}
                  {formatOrderItemVariantLabel(item) && (
                    <span>{formatOrderItemVariantLabel(item)}</span>
                  )}
                  <span>SKU: {item.sku}</span>
                  <span>Qty: {item.quantity}</span>
                </div>
                <strong>{formatListingPrice(item.line_total, order.currency_code)}</strong>
              </article>
            ))}
          </div>
        </div>

        <div className="seller-order-detail__totals">
          <div><span>Subtotal</span><strong>{formatListingPrice(order.subtotal_amount, order.currency_code)}</strong></div>
          <div><span>Shipping</span><strong>{formatListingPrice(order.shipping_amount, order.currency_code)}</strong></div>
          {order.cod_charges_amount > 0 && (
            <div><span>COD charges</span><strong>{formatListingPrice(order.cod_charges_amount, order.currency_code)}</strong></div>
          )}
          <div className="seller-order-detail__totals-total">
            <span>Total</span>
            <strong>{formatListingPrice(order.total_amount, order.currency_code)}</strong>
          </div>
        </div>

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
