import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerDashboardPage() {
  return (
    <SellerDashboardShell
      title="Dashboard"
      subtitle="Monitor operations, orders, inventory, payouts, and marketplace performance."
    >
      <section className="seller-kpi-grid">
        <article>
          <span>Today revenue</span>
          <strong>$4,280</strong>
          <p>+12.4% from yesterday</p>
        </article>
        <article>
          <span>Open orders</span>
          <strong>38</strong>
          <p>9 need dispatch today</p>
        </article>
        <article>
          <span>Active products</span>
          <strong>246</strong>
          <p>18 low stock alerts</p>
        </article>
        <article>
          <span>Seller health</span>
          <strong>96%</strong>
          <p>Excellent account standing</p>
        </article>
      </section>

      <section className="seller-console-grid">
        <article className="seller-console-card seller-console-card--wide">
          <div className="seller-console-card__header">
            <div>
              <h2>Sales performance</h2>
              <p>Revenue trend for the current week</p>
            </div>
            <button type="button">View report</button>
          </div>
          <div className="seller-chart-preview" aria-label="Sales chart preview">
            {[46, 62, 54, 80, 72, 88, 96].map((height, index) => (
              <span key={`sales-bar-${index + 1}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Account status</h2>
              <p>Compliance and verification</p>
            </div>
          </div>
          <div className="seller-status-list">
            <div><strong>Email verified</strong><span>Complete</span></div>
            <div><strong>Business profile</strong><span>Review pending</span></div>
            <div><strong>Payout method</strong><span>Connected</span></div>
          </div>
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Priority actions</h2>
              <p>Tasks that need attention</p>
            </div>
          </div>
          <div className="seller-action-list">
            <button type="button">Confirm 9 orders</button>
            <button type="button">Restock 18 products</button>
            <button type="button">Resolve 2 support cases</button>
          </div>
        </article>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Recent orders</h2>
            <p>Latest customer orders requiring seller action</p>
          </div>
          <button type="button">Manage orders</button>
        </div>

        <div className="seller-table">
          <div className="seller-table__row seller-table__row--head">
            <span>Order</span>
            <span>Customer</span>
            <span>Status</span>
            <span>Total</span>
          </div>
          <div className="seller-table__row">
            <span>#AGT-20491</span>
            <span>Rahul Menon</span>
            <strong>Ready to ship</strong>
            <span>$128.40</span>
          </div>
          <div className="seller-table__row">
            <span>#AGT-20488</span>
            <span>Sara Thomas</span>
            <strong>Payment confirmed</strong>
            <span>$84.10</span>
          </div>
          <div className="seller-table__row">
            <span>#AGT-20482</span>
            <span>Mohammed Ali</span>
            <strong>Dispatch today</strong>
            <span>$212.00</span>
          </div>
        </div>
      </section>
    </SellerDashboardShell>
  )
}
