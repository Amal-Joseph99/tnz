import { AdminDashboardShell } from '../components/AdminDashboardShell'

const orders = [
  { id: 'AGT-20491', buyer: 'Riya Menon', seller: 'AGTRENZ Partner Store', amount: '$428.00', status: 'Pack now', date: 'Jun 18' },
  { id: 'AGT-20488', buyer: 'Arjun Nair', seller: 'UrbanCraft India', amount: '$96.50', status: 'Confirmed', date: 'Jun 18' },
  { id: 'AGT-20412', buyer: 'Sneha Das', seller: 'Northline Essentials', amount: '$214.00', status: 'Dispute', date: 'Jun 17' },
  { id: 'AGT-20398', buyer: 'Vivek Kumar', seller: 'GreenLeaf Organics', amount: '$52.30', status: 'Delivered', date: 'Jun 16' },
]

export function AdminOrdersPage() {
  return (
    <AdminDashboardShell
      title="Orders"
      subtitle="Monitor marketplace orders, fulfillment SLAs, and dispute cases."
    >
      <div className="admin-kpi-grid admin-kpi-grid--three">
        <article><span>Orders today</span><strong>142</strong><p>Across all sellers</p></article>
        <article><span>At risk</span><strong>8</strong><p>Dispatch deadline within 6 hours</p></article>
        <article><span>Open disputes</span><strong>5</strong><p>Require admin intervention</p></article>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Order operations</h2>
            <p>Filter by status, seller, or dispute flag.</p>
          </div>
          <div className="admin-toolbar-actions">
            <select aria-label="Filter order status">
              <option>All statuses</option>
              <option>Confirmed</option>
              <option>Shipped</option>
              <option>Dispute</option>
            </select>
            <button type="button" className="admin-btn admin-btn--ghost">Export</button>
          </div>
        </div>
        <div className="admin-table">
          <div className="admin-table__row admin-table__row--head">
            <span>Order</span><span>Buyer</span><span>Seller</span><span>Amount</span><span>Status</span><span>Date</span>
          </div>
          {orders.map((order) => (
            <div key={order.id} className="admin-table__row">
              <span>{order.id}</span>
              <span>{order.buyer}</span>
              <span>{order.seller}</span>
              <span>{order.amount}</span>
              <strong>{order.status}</strong>
              <span>{order.date}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
