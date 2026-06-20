import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import {
  fetchAdminOrders,
  formatOrderStatus,
  getShipmentRow,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { adminPushOrderToShiprocket } from '../lib/shiprocketShipping'

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setOrders(await fetchAdminOrders())
  }

  useEffect(() => {
    void loadOrders().finally(() => setLoading(false))
  }, [])

  const pushToShiprocket = async (orderId: number) => {
    setError('')
    setMessage('')
    try {
      const result = await adminPushOrderToShiprocket(orderId)
      setMessage(`Shiprocket order created. AWB ${result.awbCode}`)
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shiprocket push failed.')
    }
  }

  const pendingPush = orders.filter((order) => order.status === 'seller_accepted' || order.status === 'shiprocket_pending')

  return (
    <AdminDashboardShell title="Orders" subtitle="Push seller-accepted India-origin orders to Shiprocket.">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="admin-bento">
        <article className="admin-bento__cell admin-bento__cell--stat">
          <span>Total orders</span>
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
        </div>

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="admin-table">
            {orders.map((order) => {
              const shipment = getShipmentRow(order)
              return (
                <article key={order.id} className="admin-table__row">
                  <div>
                    <strong>{order.order_number}</strong>
                    <p>{formatOrderStatus(order.status)}</p>
                    <p>{order.shipping_lane === 'india_domestic' ? 'India domestic' : 'India → international'}</p>
                    <p>{order.payment_method.toUpperCase()}</p>
                  </div>
                  <div>
                    {(order.status === 'seller_accepted' || order.status === 'shiprocket_pending') && (
                      <button type="button" className="admin-btn" onClick={() => void pushToShiprocket(order.id)}>
                        Create on Shiprocket
                      </button>
                    )}
                    {shipment?.awb_code && <p>AWB: {shipment.awb_code}</p>}
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
