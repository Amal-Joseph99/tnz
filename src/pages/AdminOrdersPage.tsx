import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { useCurrency } from '../context/CurrencyContext'
import {
  fetchAdminOrders,
  fetchOrderProductThumbnails,
  formatOrderStatus,
  formatPaymentMethod,
  getOrderThumbnailProductId,
  getPrimaryOrderItem,
  getShipmentRow,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { adminPushOrderToShiprocket } from '../lib/shiprocketShipping'

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const { formatListingPrice } = useCurrency()
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pushingOrderId, setPushingOrderId] = useState<number | null>(null)

  const loadOrders = async () => {
    const rows = await fetchAdminOrders()
    setOrders(rows)

    const productIds = rows
      .map((order) => getOrderThumbnailProductId(order))
      .filter((id): id is number => id !== null)

    setThumbnails(await fetchOrderProductThumbnails(productIds))
  }

  useEffect(() => {
    void loadOrders().finally(() => setLoading(false))
  }, [])

  const pendingPush = useMemo(
    () => orders.filter((order) => order.status === 'seller_accepted' || order.status === 'shiprocket_pending'),
    [orders],
  )

  const pushToShiprocket = async (orderId: number) => {
    setError('')
    setMessage('')
    setPushingOrderId(orderId)

    try {
      const result = await adminPushOrderToShiprocket(orderId)
      setMessage(`Shiprocket order created. AWB ${result.awbCode}`)
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shiprocket push failed.')
    } finally {
      setPushingOrderId(null)
    }
  }

  return (
    <AdminDashboardShell title="Orders" subtitle="Confirmed marketplace orders and Shiprocket dispatch.">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="admin-bento">
        <article className="admin-bento__cell admin-bento__cell--stat">
          <span>Confirmed orders</span>
          <strong>{orders.length}</strong>
        </article>
        <article className="admin-bento__cell admin-bento__cell--stat">
          <span>Awaiting Shiprocket</span>
          <strong>{pendingPush.length}</strong>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Order operations</h2>
          <p>Only paid or placed COD orders are shown. Unpaid checkouts are hidden.</p>
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No confirmed orders yet.</p>
        ) : (
          <div className="seller-order-list">
            {orders.map((order) => {
              const primaryItem = getPrimaryOrderItem(order)
              const productId = getOrderThumbnailProductId(order)
              const imageUrl = productId ? thumbnails.get(productId) : undefined
              const shipment = getShipmentRow(order)
              const canPush = order.status === 'seller_accepted' || order.status === 'shiprocket_pending'

              return (
                <article key={order.id} className="seller-order-list__row">
                  <div className="seller-order-list__product">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={primaryItem?.product_name ?? 'Product'}
                        className="seller-order-list__thumb"
                      />
                    ) : (
                      <div className="seller-order-list__thumb seller-order-list__thumb--empty">No image</div>
                    )}
                    <div className="seller-order-list__copy">
                      <strong>{order.order_number}</strong>
                      <span>{primaryItem?.product_name ?? 'Order item'}</span>
                      <small>{formatListingPrice(order.total_amount, order.currency_code)}</small>
                    </div>
                  </div>

                  <div className="seller-order-list__buyer">
                    <span>Buyer</span>
                    <strong>{order.delivery_full_name}</strong>
                    <small>{order.delivery_city}, {order.delivery_country_iso2}</small>
                  </div>

                  <div className="seller-order-list__status">
                    <span className="seller-order-list__badge">{formatOrderStatus(order.status)}</span>
                    <small>{formatPaymentMethod(order.payment_method)}</small>
                    {shipment?.awb_code && <small>AWB: {shipment.awb_code}</small>}
                  </div>

                  <div className="seller-order-list__actions">
                    {canPush && (
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={pushingOrderId === order.id}
                        onClick={() => void pushToShiprocket(order.id)}
                      >
                        {pushingOrderId === order.id ? 'Creating…' : 'Create on Shiprocket'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      View
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
