import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function SellerWalletPage() {
  return (
    <SellerDashboardShell title="Wallet" subtitle="Review settlements, pending payouts, fees, and transaction history.">
      <section className="seller-kpi-grid seller-kpi-grid--three">
        <article><span>Available balance</span><strong>$0</strong><p>No balance available</p></article>
        <article><span>Pending settlement</span><strong>$0</strong><p>No pending settlements</p></article>
        <article><span>Marketplace fees</span><strong>$0</strong><p>No fees this cycle</p></article>
      </section>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div><h2>Recent transactions</h2><p>Payouts and order settlements.</p></div>
        </div>
        <PanelEmptyState
          title="No transactions yet"
          message="Settlements and payouts will be listed here after your first sales."
        />
      </section>
    </SellerDashboardShell>
  )
}
