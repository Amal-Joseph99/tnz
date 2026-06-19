import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function AdminOrdersPage() {
  return (
    <AdminDashboardShell
      title="Orders"
      subtitle="Monitor marketplace orders, fulfillment SLAs, and dispute cases."
    >
      <div className="admin-kpi-grid admin-kpi-grid--three">
        <article><span>Orders today</span><strong>0</strong><p>Across all sellers</p></article>
        <article><span>At risk</span><strong>0</strong><p>No dispatch risks</p></article>
        <article><span>Open disputes</span><strong>0</strong><p>No open disputes</p></article>
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
          </div>
        </div>
        <PanelEmptyState
          title="No orders yet"
          message="Marketplace orders will appear here for operations and dispute handling."
        />
      </section>
    </AdminDashboardShell>
  )
}
