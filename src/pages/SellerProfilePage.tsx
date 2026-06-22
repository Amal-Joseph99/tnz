import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { fetchSellerAccountProfile } from '../lib/sellerKyc'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

function statusLabel(status: SellerWorkflowState['kycStatus']) {
  switch (status) {
    case 'draft':
      return 'In progress'
    case 'not_submitted':
      return 'Not submitted'
    case 'pending':
      return 'Pending review'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

export function SellerProfilePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [profile, setProfile] = useState({ businessName: '', email: '', countryName: '', phone: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([fetchSellerWorkflow(), fetchSellerAccountProfile()])
      .then(([workflowState, accountProfile]) => {
        if (!active) return
        setWorkflow(workflowState)
        if (accountProfile) setProfile(accountProfile)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading || !workflow) {
    return (
      <SellerDashboardShell>
        <p>Loading seller profile...</p>
      </SellerDashboardShell>
    )
  }

  return (
    <SellerDashboardShell>
      <section className="seller-console-grid seller-console-grid--profile">
        <section className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Account details</h2>
              <p>Signup information linked to your seller account.</p>
            </div>
            <span className="seller-badge seller-badge--success">Email verified</span>
          </div>
          <div className="seller-status-list">
            <div><strong>Business name</strong><span>{profile.businessName || '—'}</span></div>
            <div><strong>Email</strong><span>{profile.email || '—'}</span></div>
            <div><strong>Phone</strong><span>{profile.phone || '—'}</span></div>
            <div><strong>Country</strong><span>{profile.countryName || '—'}</span></div>
          </div>
        </section>

        <section className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>KYC verification</h2>
              <p>
                {workflow.kycStatus === 'approved'
                  ? 'Your business identity is verified with AGTRENZ.'
                  : 'Complete KYC before warehouse setup and product listing.'}
              </p>
            </div>
          </div>
          <div className="seller-status-list">
            <div><strong>KYC ID</strong><span>{workflow.kycId || 'Not generated'}</span></div>
            <div><strong>Status</strong><span>{statusLabel(workflow.kycStatus)}</span></div>
          </div>
          <Link to="/seller/kyc" className="seller-primary-action seller-profile-kyc-link">
            {workflow.kycStatus === 'approved' ? 'View KYC verification' : 'Open KYC verification'}
          </Link>
        </section>
      </section>
    </SellerDashboardShell>
  )
}
