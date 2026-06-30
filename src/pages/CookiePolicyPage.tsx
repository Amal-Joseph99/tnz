import { CookiePolicyBody } from '../components/legal/CookiePolicyBody'

export function CookiePolicyPage() {
  return (
    <section className="simple-page simple-page--bento">
      <div className="container simple-page__inner">
        <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document seller-agreement-document--public">
          <div className="admin-bento__head seller-agreement-document__head">
            <div>
              <span className="seller-agreement-document__eyebrow">Legal</span>
              <h2>Cookie Policy</h2>
              <p>How AGTRENZ uses cookies and similar technologies on the Platform.</p>
            </div>
          </div>
          <CookiePolicyBody />
        </article>
      </div>
    </section>
  )
}
