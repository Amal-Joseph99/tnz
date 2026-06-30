import { Link } from 'react-router-dom'
import { SellerAgreementBody } from '../components/seller/SellerAgreementBody'
import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerAgreementPage() {
  return (
    <SellerDashboardShell>
      <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document">
        <div className="admin-bento__head seller-agreement-document__head">
          <div>
            <Link to="/seller/terms-policies" className="seller-order-detail__back">
              ← Back to Terms &amp; Policies
            </Link>
            <h2>Seller Agreement</h2>
            <p>Read the full terms governing sellers on the AGTRENZ marketplace.</p>
          </div>
        </div>
        <SellerAgreementBody />
      </article>
    </SellerDashboardShell>
  )
}

export function SellerAgreementPublicPage() {
  return (
    <section className="simple-page simple-page--bento">
      <div className="container simple-page__inner">
        <article className="admin-bento__cell admin-bento__cell--wide seller-agreement-document seller-agreement-document--public">
          <div className="admin-bento__head seller-agreement-document__head">
            <div>
              <span className="seller-agreement-document__eyebrow">Legal</span>
              <h2>Seller Agreement</h2>
              <p>Terms governing sellers on the AGTRENZ marketplace.</p>
            </div>
          </div>
          <SellerAgreementBody />
        </article>
      </div>
    </section>
  )
}
