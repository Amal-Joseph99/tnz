import { TermsAndConditionsBody } from '../components/legal/TermsAndConditionsBody'

export function TermsAndConditionsPage() {
  return (
    <section className="simple-page simple-page--bento">
      <div className="container simple-page__inner">
        <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document seller-agreement-document--public">
          <div className="admin-bento__head seller-agreement-document__head">
            <div>
              <span className="seller-agreement-document__eyebrow">Legal</span>
              <h2>Terms and Conditions</h2>
              <p>Rules governing your access to and use of the AGTRENZ marketplace.</p>
            </div>
          </div>
          <TermsAndConditionsBody />
        </article>
      </div>
    </section>
  )
}
