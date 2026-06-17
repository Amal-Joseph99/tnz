import { PageShell } from '../components/PageShell'

export function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="Review how AGTRENZ handles account, shopping, seller, and support data."
    >
      <article className="policy-document">
        <section>
          <h2>Information we collect</h2>
          <p>We collect account details, delivery information, order activity, support messages, and marketplace preferences needed to operate AGTRENZ.</p>
        </section>
        <section>
          <h2>How information is used</h2>
          <p>Information is used to process orders, support customers and sellers, improve product discovery, detect misuse, and maintain account security.</p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>You can update account details, manage communication preferences, and request changes through account support.</p>
        </section>
      </article>
    </PageShell>
  )
}
