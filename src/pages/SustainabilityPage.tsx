import { PageShell } from '../components/PageShell'

export function SustainabilityPage() {
  return (
    <PageShell
      eyebrow="Company"
      title="Sustainability"
      subtitle="AGTRENZ is committed to responsible marketplace growth and smarter operations."
    >
      <section className="content-document">
        <div className="content-document__lead">
          <h2>Responsible marketplace growth</h2>
          <p>
            AGTRENZ is designed to support better seller standards, practical product choices,
            and operations that reduce unnecessary friction and waste.
          </p>
        </div>
        <div className="content-document__columns">
          <article><h3>Seller standards</h3><p>Clear product information, fair pricing, and reliable fulfillment expectations.</p></article>
          <article><h3>Smarter operations</h3><p>Improved delivery planning and return handling to avoid unnecessary movement.</p></article>
          <article><h3>Better choices</h3><p>Helping customers discover durable products from trusted marketplace sellers.</p></article>
        </div>
      </section>
    </PageShell>
  )
}
