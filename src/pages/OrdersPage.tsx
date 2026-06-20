import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { useCurrency } from '../context/CurrencyContext'
import {
  fetchBuyerOrders,
  formatOrderStatus,
  getShipmentRow,
  type MarketplaceOrderRow,
} from '../lib/marketplaceOrders'
import { trackShiprocketOrder } from '../lib/shiprocketShipping'

export function OrdersPage() {
  const { formatPrice } = useCurrency()
  const [orders, setOrders] = useState<MarketplaceOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState<Record<number, unknown>>({})

  useEffect(() => {
    void fetchBuyerOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  const track = async (order: MarketplaceOrderRow) => {
    const result = await trackShiprocketOrder({ orderId: order.id })
    setTracking((current) => ({ ...current, [order.id]: result.tracking ?? result.message }))
  }

  return (
    <BuyerAccountShell title="My orders" subtitle="Track Shiprocket delivery for India-origin orders.">
      <section className="buyer-panel">
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <div className="admin-table">
            {orders.map((order) => {
              const shipment = getShipmentRow(order)
              return (
                <article key={order.id} className="buyer-order-row admin-table__row">
                  <div>
                    <strong>{order.order_number}</strong>
                    <p>{formatOrderStatus(order.status)}</p>
                    <p>{formatPrice(order.total_amount)}</p>
                    <p>ETA: {order.shipping_estimated_delivery ?? '—'}</p>
                  </div>
                  <div>
                    {shipment?.awb_code && <p>AWB: {shipment.awb_code}</p>}
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void track(order)}>
                      Refresh tracking
                    </button>
                    {tracking[order.id] !== undefined && (
                      <pre className="track-order-json">{JSON.stringify(tracking[order.id], null, 2)}</pre>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        <Link to="/track-order">Track by order number</Link>
      </section>
    </BuyerAccountShell>
  )
}
