import { PageShell } from '../components/PageShell'

export function PressPage() {
  return (
    <PageShell
      eyebrow="Company"
      title="Press"
      subtitle="Find AGTRENZ announcements, brand information, and media resources."
    >
      <section className="content-document">
        <div className="content-document__lead">
          <h2>AGTRENZ newsroom</h2>
          <p>Official company updates, marketplace announcements, and brand resources will be published here.</p>
        </div>
        <div className="press-list">
          <article><time>Jun 2026</time><h3>AGTRENZ prepares seller onboarding experience</h3><p>New seller pages and account flows are being developed for marketplace launch readiness.</p></article>
          <article><time>May 2026</time><h3>Marketplace brand system updated</h3><p>The platform is moving toward a cleaner, more professional shopping experience.</p></article>
        </div>
      </section>
    </PageShell>
  )
}
