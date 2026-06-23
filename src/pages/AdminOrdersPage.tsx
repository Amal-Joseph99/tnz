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

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const { formatListingPrice } = useCurrency()
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map())
  const [loading, setLoading] = useState(true)

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

  return (
    <AdminDashboardShell title="Orders" subtitle="Confirmed marketplace orders and Shiprocket dispatch.">
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
          <p>Only paid or placed COD orders are shown. Open an order to sync, create shipment, and download documents.</p>
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
                    {order.shipping_courier_name && <small>{order.shipping_courier_name}</small>}
                    {shipment?.awb_code && <small>AWB: {shipment.awb_code}</small>}
                  </div>

                  <div className="seller-order-list__actions">
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      Manage
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
