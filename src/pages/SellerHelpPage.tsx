import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerHelpPage() {
  return (
    <SellerDashboardShell title="Help" subtitle="Get seller support for orders, listings, payouts, and account issues.">
      <section className="seller-console-grid">
        <article className="seller-console-card">
          <h2>Contact support</h2>
          <p>Raise a professional support request with order, payout, or account context.</p>
          <form className="seller-console-form seller-console-form--single">
            <label>Support topic<input placeholder="Example: payout delay" /></label>
            <label>Message<textarea placeholder="Describe the issue clearly" /></label>
            <button type="button">Submit request</button>
          </form>
        </article>
        <article className="seller-console-card">
          <h2>Popular help topics</h2>
          <div className="seller-action-list">
            <button type="button">Listing quality requirements</button>
            <button type="button">Order cancellation rules</button>
            <button type="button">Payout schedule</button>
          </div>
        </article>
      </section>
    </SellerDashboardShell>
  )
}
