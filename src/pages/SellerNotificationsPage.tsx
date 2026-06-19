import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function SellerNotificationsPage() {
  return (
    <SellerDashboardShell title="Notifications" subtitle="Review seller alerts for orders, stock, payouts, support, and policy updates.">
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Seller alerts</h2>
            <p>Operational notifications that need attention.</p>
          </div>
          <button type="button">Mark all read</button>
        </div>
        <PanelEmptyState
          title="No seller alerts"
          message="Order, stock, payout, and policy notifications will appear here."
        />
      </section>
    </SellerDashboardShell>
  )
}
