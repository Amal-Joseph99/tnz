import { ShippingPolicyBody } from '../components/legal/ShippingPolicyBody'

export function ShippingPolicyPage() {
  return (
    <section className="simple-page simple-page--bento">
      <div className="container simple-page__inner">
        <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document seller-agreement-document--public">
          <div className="admin-bento__head seller-agreement-document__head">
            <div>
              <span className="seller-agreement-document__eyebrow">Legal</span>
              <h2>Shipping Policy</h2>
              <p>How orders are processed, shipped, and delivered through the AGTRENZ marketplace.</p>
            </div>
          </div>
          <ShippingPolicyBody />
        </article>
      </div>
    </section>
  )
}
