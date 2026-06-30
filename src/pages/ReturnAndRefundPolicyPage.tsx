import { ReturnAndRefundPolicyBody } from '../components/legal/ReturnAndRefundPolicyBody'

export function ReturnAndRefundPolicyPage() {
  return (
    <section className="simple-page simple-page--bento">
      <div className="container simple-page__inner">
        <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document seller-agreement-document--public">
          <div className="admin-bento__head seller-agreement-document__head">
            <div>
              <span className="seller-agreement-document__eyebrow">Legal</span>
              <h2>Return and Refund Policy</h2>
              <p>When returns and refunds may be requested on the AGTRENZ marketplace.</p>
            </div>
          </div>
          <ReturnAndRefundPolicyBody />
        </article>
      </div>
    </section>
  )
}
