import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

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

        <PanelEmptyState
          title="No orders yet"
          message="When you place an order, it will appear here with tracking and invoice options."
        />
      </section>
    </BuyerAccountShell>
  )
}
