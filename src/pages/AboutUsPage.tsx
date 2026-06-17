import { PageShell } from '../components/PageShell'

export function AboutUsPage() {
  return (
    <PageShell
      eyebrow="Company"
      title="About AGTRENZ"
      subtitle="AGTRENZ is building a trusted global marketplace for shoppers and sellers."
    >
      <section className="content-document">
        <div className="content-document__lead">
          <h2>Built for serious marketplace commerce</h2>
          <p>
            AGTRENZ connects shoppers with useful products and gives sellers a focused platform to
            launch, manage, and grow their business with confidence.
          </p>
        </div>
        <div className="content-document__columns">
          <article><h3>Customers</h3><p>Clear navigation, practical product discovery, secure checkout, and reliable post-order support.</p></article>
          <article><h3>Sellers</h3><p>Seller onboarding, listings, order management, and marketplace tools designed for growth.</p></article>
          <article><h3>Standards</h3><p>Quality-focused marketplace policies that protect both customers and sellers.</p></article>
        </div>
      </section>
    </PageShell>
  )
}
