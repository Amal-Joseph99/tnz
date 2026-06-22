import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
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

function StatusValue({ tone, children }: { tone: StatusTone; children: string }) {
  return <span className={`seller-status-value seller-status-value--${tone}`}>{children}</span>
}

export function SellerDashboardPage() {
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
      <SellerDashboardShell>
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
    <SellerDashboardShell>
      {onboardingComplete ? (
        <div className="seller-onboarding-banner seller-onboarding-banner--ready">
          <strong>Your seller account is active.</strong>
          <span>KYC verified, warehouse added — you can list products and manage orders.</span>
        </div>
      ) : (
        <div className="seller-onboarding-banner seller-onboarding-banner--pending">
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

      <section className="seller-kpi-grid">
        <article>
          <span>Today revenue</span>
          <strong>₹0</strong>
          <p>No sales recorded yet</p>
        </article>
        <article>
          <span>Open orders</span>
          <strong>0</strong>
          <p>No orders awaiting action</p>
        </article>
        <article>
          <span>Active products</span>
          <strong>{productStats.liveProducts}</strong>
          <p>{productStats.liveProducts ? 'Approved listings live' : 'No published listings'}</p>
        </article>
        <article>
          <span>Seller health</span>
          <strong className={onboardingComplete ? 'seller-kpi-strong--success' : undefined}>
            {sellerHealthLabel}
          </strong>
          <p>{sellerHealthDetail}</p>
        </article>
      </section>

      <section className="seller-console-grid">
        <article className="seller-console-card seller-console-card--wide">
          <div className="seller-console-card__header">
            <div>
              <h2>Sales performance</h2>
              <p>Revenue trend for the current week</p>
            </div>
          </div>
          <PanelEmptyState
            title="No sales data yet"
            message="Charts will appear after your first orders are placed."
          />
        </article>

        <article className="seller-console-card">
          <div className="seller-console-card__header">
            <div>
              <h2>Account status</h2>
              <p>Compliance and verification</p>
            </div>
            {onboardingComplete ? (
              <span className="seller-badge seller-badge--success">Ready to sell</span>
            ) : null}
          </div>
          <div className="seller-status-list">
            <div>
              <strong>Email verified</strong>
              <StatusValue tone={profile.email ? 'success' : 'muted'}>
                {profile.email ? 'Verified' : 'Unknown'}
              </StatusValue>
            </div>
            <div>
              <strong>KYC verification</strong>
              <StatusValue tone={kycStatusTone(workflow.kycStatus)}>
                {kycStatusLabel(workflow.kycStatus)}
              </StatusValue>
            </div>
            <div>
              <strong>Warehouse</strong>
              <StatusValue tone={workflow.warehouseCompleted ? 'success' : 'pending'}>
                {workflow.warehouseCompleted ? 'Added' : 'Not added'}
              </StatusValue>
            </div>
            <div>
              <strong>Business profile</strong>
              <StatusValue tone={profile.businessName ? 'success' : 'muted'}>
                {profile.businessName || 'Not provided'}
              </StatusValue>
            </div>
            <div>
              <strong>Payout method</strong>
              <StatusValue tone={payoutConnected ? 'success' : 'pending'}>
                {payoutConnected ? 'Connected' : 'Not connected'}
              </StatusValue>
            </div>
          </div>
        </article>
      </section>
    </SellerDashboardShell>
  )
}
