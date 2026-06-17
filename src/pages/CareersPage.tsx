import { PageShell } from '../components/PageShell'

export function CareersPage() {
  return (
    <PageShell
      eyebrow="Company"
      title="Careers"
      subtitle="Join AGTRENZ and help shape the next generation of marketplace commerce."
    >
      <section className="content-document">
        <div className="content-document__lead">
          <h2>Work on a practical commerce platform</h2>
          <p>We are looking for people who care about reliable shopping, seller success, and disciplined product execution.</p>
        </div>
        <div className="career-list">
          <article><span>Product</span><h3>Frontend Engineer</h3><p>Build fast customer and seller experiences using React and TypeScript.</p></article>
          <article><span>Operations</span><h3>Marketplace Operations Associate</h3><p>Improve order quality, seller standards, and customer resolution workflows.</p></article>
          <article><span>Support</span><h3>Customer Experience Specialist</h3><p>Help customers and sellers resolve issues with clear, professional support.</p></article>
        </div>
      </section>
    </PageShell>
  )
}
