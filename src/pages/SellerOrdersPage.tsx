import { useEffect, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import {
  fetchSellerOrders,
  formatOrderStatus,
  getShipmentRow,
  sellerMarkOrderPacked,
  sellerRespondToOrder,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { sellerFetchShipmentDocuments } from '../lib/shiprocketShipping'

export function SellerOrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setOrders(await fetchSellerOrders())
  }

  useEffect(() => {
    void loadOrders().finally(() => setLoading(false))
  }, [])

  const respond = async (orderId: number, accept: boolean) => {
    setError('')
    setMessage('')
    const result = await sellerRespondToOrder(orderId, accept)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage(accept ? 'Order accepted.' : 'Order rejected.')
    await loadOrders()
  }

  const downloadDocs = async (orderId: number) => {
    setError('')
    try {
      const result = await sellerFetchShipmentDocuments(orderId)
      if (result.labelUrl) window.open(result.labelUrl, '_blank', 'noopener,noreferrer')
      if (result.manifestUrl) window.open(result.manifestUrl, '_blank', 'noopener,noreferrer')
      setMessage('Label and manifest ready.')
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch documents.')
    }
  }

  const markPacked = async (orderId: number) => {
    setError('')
    const result = await sellerMarkOrderPacked(orderId)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Order marked packed.')
    await loadOrders()
  }

  return (
    <SellerDashboardShell title="Orders" subtitle="Accept/reject orders, download Shiprocket label & manifest, mark packed.">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <h2>Order queue</h2>
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
                    <p>{order.delivery_city}, {order.delivery_country_iso2}</p>
                  </div>
                  <div>
                    {order.status === 'pending_seller_acceptance' && (
                      <>
                        <button type="button" className="admin-accept" onClick={() => void respond(order.id, true)}>Accept</button>
                        <button type="button" className="admin-reject" onClick={() => void respond(order.id, false)}>Reject</button>
                      </>
                    )}
                    {['shiprocket_created', 'packed', 'shipped', 'delivered'].includes(order.status) && (
                      <>
                        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void downloadDocs(order.id)}>
                          Label / manifest
                        </button>
                        {order.status === 'shiprocket_created' && (
                          <button type="button" className="admin-accept" onClick={() => void markPacked(order.id)}>Mark packed</button>
                        )}
                      </>
                    )}
                    {shipment?.awb_code && <p>AWB: {shipment.awb_code}</p>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </SellerDashboardShell>
  )
}
