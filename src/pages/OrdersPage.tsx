import { Link } from 'react-router-dom'
import { BuyerAccountShell } from '../components/BuyerAccountShell'

const orders = [
  {
    id: 'AGT-10291',
    title: 'Wireless headphones and travel pouch',
    placed: 'Jun 14, 2026',
    items: 2,
    payment: 'Paid online',
    status: 'Preparing',
    statusClass: 'buyer-status--warning',
    eta: 'Estimated delivery Jun 20',
    action: { label: 'Track', to: '/track-order' },
  },
  {
    id: 'AGT-10244',
    title: 'Home organizer set',
    placed: 'Jun 02, 2026',
    items: 1,
    payment: 'Invoice available',
    status: 'Delivered',
    statusClass: 'buyer-status--success',
    eta: 'Delivered Jun 07',
    action: { label: 'Return', to: '/returns' },
  },
  {
    id: 'AGT-10188',
    title: 'Men ankle socks pack of 5',
    placed: 'May 28, 2026',
    items: 1,
    payment: 'Paid online',
    status: 'Shipped',
    statusClass: 'buyer-status--info',
    eta: 'Out for delivery Jun 19',
    action: { label: 'Track', to: '/track-order' },
  },
]

export function OrdersPage() {
  return (
    <BuyerAccountShell
      title="My orders"
      subtitle="View current orders, delivery updates, invoices, and return actions."
    >
      <section className="buyer-panel">
        <div className="buyer-panel__header buyer-panel__header--toolbar">
          <div>
            <h2>Recent orders</h2>
            <p>Track purchases, invoices, delivery progress, and returns.</p>
          </div>
          <select aria-label="Filter orders" className="buyer-select">
            <option>Last 30 days</option>
            <option>Last 6 months</option>
            <option>All orders</option>
          </select>
        </div>

        <div className="buyer-order-list">
          {orders.map((order) => (
            <article key={order.id} className="buyer-order-row">
              <div className="buyer-order-row__main">
                <span className="buyer-order-row__id">Order #{order.id}</span>
                <h3>{order.title}</h3>
                <p>
                  Placed {order.placed} · {order.items} item{order.items > 1 ? 's' : ''} · {order.payment}
                </p>
              </div>
              <div className="buyer-order-row__status">
                <strong className={`buyer-status ${order.statusClass}`}>{order.status}</strong>
                <span>{order.eta}</span>
              </div>
              <div className="buyer-order-row__actions">
                <Link to={order.action.to}>{order.action.label}</Link>
                <button type="button">Invoice</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </BuyerAccountShell>
  )
}
