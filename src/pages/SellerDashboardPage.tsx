import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { useCurrency } from '../context/CurrencyContext'
import { fetchSellerAccountProfile, fetchSellerKycSubmission } from '../lib/sellerKyc'
import {
  computeSellerProductCatalogueStats,
  fetchSellerProductCatalogue,
} from '../lib/sellerProducts'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

type StatusTone = 'success' | 'pending' | 'muted' | 'danger'

function kycStatusLabel(status: SellerWorkflowState['kycStatus']) {
  switch (status) {
    case 'draft':
      return 'In progress'
    case 'not_submitted':
      return 'Not submitted'
    case 'pending':
      return 'Pending review'
    case 'approved':
      return 'Verified'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

function kycStatusTone(status: SellerWorkflowState['kycStatus']): StatusTone {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending') return 'pending'
  return 'muted'
}

function StatusPill({ tone, children }: { tone: StatusTone; children: string }) {
  if (tone === 'success') {
    return <span className="admin-status-pill admin-status-pill--ok">{children}</span>
  }
  if (tone === 'pending') {
    return <span className="admin-status-pill admin-status-pill--warn">{children}</span>
  }
  if (tone === 'danger') {
    return <span className="admin-status-pill admin-status-pill--warn">{children}</span>
  }
  return <span className="admin-status-pill">{children}</span>
}

export function SellerDashboardPage() {
  const { formatListingPrice } = useCurrency()
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [profile, setProfile] = useState({ businessName: '', email: '' })
  const [payoutConnected, setPayoutConnected] = useState(false)
  const [productStats, setProductStats] = useState({ liveProducts: 0, lowStock: 0, outOfStock: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchSellerAccountProfile(),
      fetchSellerKycSubmission(),
      fetchSellerProductCatalogue(),
    ])
      .then(([workflowState, accountProfile, kycSubmission, catalogue]) => {
        if (!active) return

        setWorkflow(workflowState)
        if (accountProfile) {
          setProfile({ businessName: accountProfile.businessName, email: accountProfile.email })
        }
        setPayoutConnected(
          Boolean(
            kycSubmission?.bankName?.trim()
              && kycSubmission?.accountNumber?.trim()
              && kycSubmission?.ifscSwift?.trim(),
          ),
        )
        setProductStats(computeSellerProductCatalogueStats(catalogue))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const onboardingComplete = useMemo(
    () => workflow?.kycStatus === 'approved' && workflow.warehouseCompleted,
    [workflow],
  )

  if (loading || !workflow) {
    return (
      <SellerDashboardShell title="Dashboard">
        <p>Loading dashboard...</p>
      </SellerDashboardShell>
    )
  }

  const sellerHealthLabel = onboardingComplete ? 'Active' : 'Setup required'
  const sellerHealthDetail = onboardingComplete
    ? 'KYC verified and warehouse ready'
    : workflow.kycStatus !== 'approved'
      ? 'Complete KYC verification to continue'
      : 'Add your warehouse address to list products'

  return (
    <SellerDashboardShell title="Dashboard">
      <section className="admin-bento" aria-label="Seller dashboard overview">
        {onboardingComplete ? (
          <div className="admin-bento__alert seller-onboarding-banner seller-onboarding-banner--ready">
            <strong>Your seller account is active.</strong>
            <span>KYC verified, warehouse added — you can list products and manage orders.</span>
          </div>
        ) : (
          <div className="admin-bento__alert seller-onboarding-banner seller-onboarding-banner--pending">
            <strong>Finish seller setup</strong>
            <span>
              {workflow.kycStatus !== 'approved' ? (
                <>
                  Complete <Link to="/seller/kyc">KYC verification</Link> first.
                </>
              ) : null}
              {workflow.kycStatus !== 'approved' && !workflow.warehouseCompleted ? ' Then ' : null}
              {!workflow.warehouseCompleted ? (
                <>
                  Add your <Link to="/seller/warehouse">warehouse address</Link>.
                </>
              ) : null}
            </span>
          </div>
        )}

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--stat-note admin-bento__cell--accent-blue">
          <span>Today revenue</span>
          <strong>{formatListingPrice(0, 'INR')}</strong>
          <p>No sales recorded yet</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--stat-note admin-bento__cell--accent-amber">
          <span>Open orders</span>
          <strong>0</strong>
          <p>No orders awaiting action</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--stat-note admin-bento__cell--accent-violet">
          <span>Active products</span>
          <strong>{productStats.liveProducts}</strong>
          <p>{productStats.liveProducts ? 'Approved listings live' : 'No published listings'}</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--stat admin-bento__cell--stat-note admin-bento__cell--accent-slate">
          <span>Seller health</span>
          <strong>{sellerHealthLabel}</strong>
          <p>{sellerHealthDetail}</p>
        </article>

        <article className="admin-bento__cell admin-bento__cell--wide admin-bento__cell--tall">
          <div className="admin-bento__head">
            <h2>Sales performance</h2>
            <Link to="/seller/orders" className="admin-btn admin-btn--ghost">Orders</Link>
          </div>
          <div className="admin-bento__empty">Charts will appear after your first orders are placed.</div>
        </article>

        <article className="admin-bento__cell">
          <h2 className="admin-bento__title">Account status</h2>
          <div className="admin-status-list">
            <div>
              <strong>Email verified</strong>
              <StatusPill tone={profile.email ? 'success' : 'muted'}>
                {profile.email ? 'Verified' : 'Unknown'}
              </StatusPill>
            </div>
            <div>
              <strong>KYC verification</strong>
              <StatusPill tone={kycStatusTone(workflow.kycStatus)}>
                {kycStatusLabel(workflow.kycStatus)}
              </StatusPill>
            </div>
            <div>
              <strong>Warehouse</strong>
              <StatusPill tone={workflow.warehouseCompleted ? 'success' : 'pending'}>
                {workflow.warehouseCompleted ? 'Added' : 'Not added'}
              </StatusPill>
            </div>
            <div>
              <strong>Business profile</strong>
              <StatusPill tone={profile.businessName ? 'success' : 'muted'}>
                {profile.businessName || 'Not provided'}
              </StatusPill>
            </div>
            <div>
              <strong>Payout method</strong>
              <StatusPill tone={payoutConnected ? 'success' : 'pending'}>
                {payoutConnected ? 'Connected' : 'Not connected'}
              </StatusPill>
            </div>
          </div>
        </article>

        <article className="admin-bento__cell">
          <h2 className="admin-bento__title">Quick links</h2>
          <div className="admin-action-list">
            <Link to="/seller/products">Products ({productStats.liveProducts})</Link>
            <Link to="/seller/orders">Orders</Link>
            <Link to="/seller/kyc">KYC verification</Link>
            <Link to="/seller/wallet">Wallet</Link>
          </div>
        </article>
      </section>
    </SellerDashboardShell>
  )
}
