import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { useCurrency } from '../context/CurrencyContext'
import {
  fetchAdminOrder,
  fetchOrderProductThumbnails,
  formatOrderStatus,
  formatPaymentMethod,
  getShipmentRow,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { adminPushOrderToShiprocket } from '../lib/shiprocketShipping'

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

export function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const { formatListingPrice } = useCurrency()
  const [order, setOrder] = useState<MarketplaceOrderRow | null>(null)
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pushing, setPushing] = useState(false)

  const parsedOrderId = Number(orderId)

  const loadOrder = async () => {
    if (!Number.isFinite(parsedOrderId)) {
      setOrder(null)
      return
    }

    const row = await fetchAdminOrder(parsedOrderId)
    setOrder(row)

    if (row?.marketplace_order_items?.length) {
      const productIds = row.marketplace_order_items.map((item) => item.product_id)
      setThumbnails(await fetchOrderProductThumbnails(productIds))
    }
  }

  useEffect(() => {
    void loadOrder().finally(() => setLoading(false))
  }, [parsedOrderId])

  const pushToShiprocket = async () => {
    if (!order) return
    setPushing(true)
    setError('')
    setMessage('')

    try {
      const result = await adminPushOrderToShiprocket(order.id)
      setMessage(`Shiprocket order created. AWB ${result.awbCode}`)
      await loadOrder()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shiprocket push failed.')
    } finally {
      setPushing(false)
    }
  }

  if (loading) {
    return (
      <AdminDashboardShell title="Order details">
        <p>Loading order...</p>
      </AdminDashboardShell>
    )
  }

  if (!order) {
    return (
      <AdminDashboardShell title="Order details">
        <section className="admin-panel">
          <h2>Order not found</h2>
          <p>This confirmed order is unavailable.</p>
          <Link to="/admin/orders" className="admin-btn admin-btn--ghost">Back to orders</Link>
        </section>
      </AdminDashboardShell>
    )
  }

  const shipment = getShipmentRow(order)
  const canPush = order.status === 'seller_accepted' || order.status === 'shiprocket_pending'
  const addressLines = [
    order.delivery_address_line1,
    order.delivery_address_line2,
    `${order.delivery_city}, ${order.delivery_state} ${order.delivery_postcode}`,
    order.delivery_country_iso2,
  ].filter(Boolean)

  return (
    <AdminDashboardShell title="Order details" subtitle={order.order_number}>
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="admin-panel seller-order-detail">
        <div className="admin-panel__header">
          <div>
            <Link to="/admin/orders" className="seller-order-detail__back">← Back to orders</Link>
            <h2>{order.order_number}</h2>
            <p>{formatOrderStatus(order.status)}</p>
          </div>
          {canPush && (
            <button type="button" className="admin-btn" disabled={pushing} onClick={() => void pushToShiprocket()}>
              {pushing ? 'Creating on Shiprocket…' : 'Create on Shiprocket'}
            </button>
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
              <div><dt>Lane</dt><dd>{order.shipping_lane === 'india_domestic' ? 'India domestic' : 'India → international'}</dd></div>
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

        {shipment?.awb_code && (
          <p className="seller-order-detail__awb">AWB: {shipment.awb_code}</p>
        )}

        {order.seller_response_note && (
          <p className="seller-order-detail__note">Seller note: {order.seller_response_note}</p>
        )}
      </section>
    </AdminDashboardShell>
  )
}
