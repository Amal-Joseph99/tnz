import { SellerDashboardShell } from '../components/SellerDashboardShell'

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
        <div className="seller-notification-list">
          <article><strong>9 orders need confirmation</strong><p>Confirm before today’s dispatch cutoff to protect account health.</p><span>10 minutes ago</span></article>
          <article><strong>18 products are low in stock</strong><p>Restock or pause listings to avoid cancellation risk.</p><span>1 hour ago</span></article>
          <article><strong>Payout statement is ready</strong><p>Your latest settlement report is available in Wallet.</p><span>Yesterday</span></article>
        </div>
      </section>
    </SellerDashboardShell>
  )
}
