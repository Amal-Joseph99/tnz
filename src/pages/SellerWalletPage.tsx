import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerWalletPage() {
  return (
    <SellerDashboardShell title="Wallet" subtitle="Review settlements, pending payouts, fees, and transaction history.">
      <section className="seller-kpi-grid seller-kpi-grid--three">
        <article><span>Available balance</span><strong>$8,420</strong><p>Ready for next payout</p></article>
        <article><span>Pending settlement</span><strong>$2,180</strong><p>Clears after delivery window</p></article>
        <article><span>Marketplace fees</span><strong>$318</strong><p>This billing cycle</p></article>
      </section>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div><h2>Recent transactions</h2><p>Payouts and order settlements.</p></div>
          <button type="button">Export</button>
        </div>
        <div className="seller-table">
          <div className="seller-table__row seller-table__row--head"><span>Date</span><span>Type</span><span>Status</span><span>Amount</span></div>
          <div className="seller-table__row"><span>Jun 17</span><span>Order settlement</span><strong>Processed</strong><span>$428.00</span></div>
          <div className="seller-table__row"><span>Jun 15</span><span>Payout</span><strong>Completed</strong><span>$1,840.00</span></div>
        </div>
      </section>
    </SellerDashboardShell>
  )
}
