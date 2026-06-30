import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'

const policyLinks = [
  {
    title: 'Seller Agreement',
    description: 'Full terms governing sellers on the AGTRENZ marketplace.',
    to: '/seller/agreement',
  },
] as const

export function SellerTermsPoliciesPage() {
  return (
    <SellerDashboardShell>
      <article className="admin-bento__cell admin-bento__cell--wide seller-policy-document">
        <div className="admin-bento__head">
          <div>
            <h2>Terms &amp; Policies</h2>
            <p>Review the legal documents that apply to your seller account.</p>
          </div>
        </div>
        <div className="seller-policy-links">
          {policyLinks.map((item) => (
            <Link key={item.to} to={item.to} className="seller-policy-links__card">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </article>
    </SellerDashboardShell>
  )
}
