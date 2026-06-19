import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function SellerOrdersPage() {
  return (
    <SellerDashboardShell title="Orders" subtitle="Track confirmed, packed, shipped, delivered, and return orders.">
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Order queue</h2>
            <p>Prioritized by dispatch deadline.</p>
          </div>
        </div>
        <PanelEmptyState
          title="No orders in queue"
          message="Confirmed customer orders will appear here for packing and dispatch."
        />
      </section>
    </SellerDashboardShell>
  )
}
