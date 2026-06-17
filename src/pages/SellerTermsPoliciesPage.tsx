import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerTermsPoliciesPage() {
  return (
    <SellerDashboardShell title="Terms & Policies" subtitle="Review seller responsibilities, listing standards, fulfilment rules, and payout terms.">
      <article className="seller-console-card seller-policy-document">
        <section>
          <h2>Seller responsibilities</h2>
          <p>Sellers must provide accurate listings, lawful products, reliable stock information, and professional customer resolution.</p>
        </section>
        <section>
          <h2>Fulfilment standards</h2>
          <p>Orders must be packed, shipped, and updated before the dispatch deadline shown in Seller Central.</p>
        </section>
        <section>
          <h2>Payout and compliance</h2>
          <p>Payouts are subject to settlement windows, return periods, fee deductions, and account verification status.</p>
        </section>
      </article>
    </SellerDashboardShell>
  )
}
