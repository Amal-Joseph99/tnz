import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function SellerDashboardPage() {
  return (
    <SellerDashboardShell
      title="Dashboard"
      subtitle="Monitor operations, orders, inventory, payouts, and marketplace performance."
    >
      <section className="seller-kpi-grid">
        <article>
          <span>Today revenue</span>
          <strong>$0</strong>
          <p>No sales recorded yet</p>
        </article>
        <article>
          <span>Open orders</span>
          <strong>0</strong>
          <p>No orders awaiting action</p>
        </article>
        <article>
          <span>Active products</span>
          <strong>0</strong>
          <p>No published listings</p>
        </article>
        <article>
          <span>Seller health</span>
          <strong>—</strong>
          <p>Complete onboarding to activate</p>
        </article>
      </section>

      <section className="seller-console-grid">
        <article className="seller-console-card seller-console-card--wide">
          <div className="seller-console-card__header">
            <div>
              <h2>Sales performance</h2>
              <p>Revenue trend for the current week</p>
            </div>
          </div>
          <PanelEmptyState
            title="No sales data yet"
            message="Charts will appear after your first orders are placed."
          />
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Account status</h2>
              <p>Compliance and verification</p>
            </div>
          </div>
          <div className="seller-status-list">
            <div><strong>Email verified</strong><span>Pending</span></div>
            <div><strong>Business profile</strong><span>Not started</span></div>
            <div><strong>Payout method</strong><span>Not connected</span></div>
          </div>
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Priority actions</h2>
              <p>Tasks that need attention</p>
            </div>
          </div>
          <PanelEmptyState
            title="No pending actions"
            message="Operational tasks will show here when orders or listings need attention."
          />
        </article>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Recent orders</h2>
            <p>Latest customer orders requiring seller action</p>
          </div>
        </div>
        <PanelEmptyState
          title="No orders yet"
          message="Customer orders will appear here once your listings are live."
        />
      </section>
    </SellerDashboardShell>
  )
}
