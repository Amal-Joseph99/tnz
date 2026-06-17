import { PageShell } from '../components/PageShell'

export function TermsOfServicePage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Understand the rules for using AGTRENZ as a shopper or seller."
    >
      <article className="policy-document">
        <section>
          <h2>Marketplace use</h2>
          <p>Customers and sellers must use AGTRENZ responsibly, provide accurate information, and follow applicable marketplace policies.</p>
        </section>
        <section>
          <h2>Orders and payments</h2>
          <p>Product availability, pricing, delivery estimates, cancellation options, and return eligibility may vary by seller and location.</p>
        </section>
        <section>
          <h2>Seller responsibilities</h2>
          <p>Sellers are responsible for accurate listings, quality standards, timely fulfillment, and professional customer resolution.</p>
        </section>
      </article>
    </PageShell>
  )
}
