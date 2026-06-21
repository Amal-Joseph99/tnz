import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { AdminKycApproveDialog } from '../components/AdminKycApproveDialog'
import { AdminKycVerificationForm } from '../components/AdminKycVerificationForm'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { RejectionReasonDialog } from '../components/RejectionReasonDialog'
import {
  fetchAdminKycDetail,
  fetchKycQueue,
  reviewSellerKyc,
  type KycDetail,
  type KycQueueItem,
} from '../lib/adminApprovals'
import { getSignedStorageUrl } from '../lib/sellerStorage'

function queueItemFromDetail(userId: string, detail: KycDetail): KycQueueItem {
  const submission = detail.submission
  return {
    userId,
    kycId: String(submission.kyc_id ?? ''),
    status: String(submission.status ?? ''),
    businessType: String(submission.business_type ?? ''),
    businessName: String(submission.business_name ?? ''),
    businessAddress: String(submission.business_address ?? ''),
    taxId: submission.tax_id ? String(submission.tax_id) : null,
    accountHolderName: String(submission.account_holder_name ?? ''),
    bankName: String(submission.bank_name ?? ''),
    accountNumber: String(submission.account_number ?? ''),
    ifscSwift: String(submission.ifsc_swift ?? ''),
    submittedAt: String(submission.submitted_at ?? ''),
    reviewedAt: submission.reviewed_at ? String(submission.reviewed_at) : null,
    rejectionReason: submission.rejection_reason ? String(submission.rejection_reason) : null,
    sellerEmail: detail.sellerEmail,
    signupBusinessName: detail.signupBusinessName,
    countryName: detail.countryName,
    phone: detail.phone,
  }
}

export function AdminKycPage() {
  const [queue, setQueue] = useState<KycQueueItem[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<KycDetail | null>(null)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [approveTarget, setApproveTarget] = useState<KycQueueItem | null>(null)

  const loadQueue = async (status: string) => {
    setLoading(true)
    setError('')
    const { items, error: loadError } = await fetchKycQueue(status === 'all' ? undefined : status)
    setQueue(items)
    if (loadError) {
      setError(loadError)
    }
    setLoading(false)
    return items
  }

  useEffect(() => {
    void loadQueue(filter).then((items) => {
      const firstPending = items.find((item) => item.status === 'pending')
      if (firstPending) {
        setSelectedUserId(firstPending.userId)
      }
    })
  }, [filter])

  useEffect(() => {
    if (!selectedUserId) {
      setDetail(null)
      setDocumentUrls({})
      return
    }

    setDetailLoading(true)
    void fetchAdminKycDetail(selectedUserId).then(async (nextDetail) => {
      setDetail(nextDetail)
      if (!nextDetail) {
        setDocumentUrls({})
        setDetailLoading(false)
        return
      }

      const urls: Record<string, string> = {}
      await Promise.all(
        nextDetail.documents.map(async (doc) => {
          const key = doc.documentSlot ? `${doc.documentType}:${doc.documentSlot}` : doc.documentType
          const url = await getSignedStorageUrl('seller-kyc', doc.storagePath)
          if (url) urls[key] = url
        }),
      )
      setDocumentUrls(urls)
      setDetailLoading(false)
    })
  }, [selectedUserId])

  const handleDecision = async (userId: string, approved: boolean, rejectionReason?: string) => {
    setError('')
    setMessage('')

    const result = await reviewSellerKyc(userId, approved, rejectionReason)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(
      approved
        ? 'KYC approved. The seller has been notified.'
        : 'KYC rejected. The seller has been notified.',
    )
    setRejectTarget(null)
    setApproveTarget(null)

    const items = await loadQueue(filter)
    if (selectedUserId === userId) {
      const nextSelection = items.find((item) => item.status === 'pending') ?? items[0] ?? null
      setSelectedUserId(nextSelection?.userId ?? null)
    }
  }

  const selectedItem =
    queue.find((item) => item.userId === selectedUserId) ??
    (selectedUserId && detail ? queueItemFromDetail(selectedUserId, detail) : null)

  const approveBusinessName = approveTarget?.businessName ?? ''

  return (
    <AdminDashboardShell
      title="KYC Approvals"
      subtitle="Review seller identity, business documents, and bank verification."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>KYC queue</h2>
            <p>All pending and in-review seller verification requests.</p>
          </div>
          <select aria-label="Filter KYC status" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>

        {error && <div className="auth-message auth-message--error">{error}</div>}
        {message && <div className="auth-message auth-message--success">{message}</div>}

        {loading ? (
          <p>Loading KYC queue...</p>
        ) : queue.length === 0 ? (
          <PanelEmptyState
            title="No KYC submissions in queue"
            message="Seller verification requests will appear here for review."
          />
        ) : (
          <div className="admin-table admin-table--categories">
            <div className="admin-table__row admin-table__row--head">
              <span>KYC ID</span>
              <span>Seller</span>
              <span>Business</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {queue.map((item) => (
              <div className="admin-table__row" key={item.userId}>
                <span>{item.kycId}</span>
                <span>{item.sellerEmail}</span>
                <span>{item.businessName}</span>
                <span>{item.status}</span>
                <span className="admin-form__actions">
                  <button type="button" onClick={() => setSelectedUserId(item.userId)}>
                    {selectedUserId === item.userId ? 'Selected' : 'View form'}
                  </button>
                  {item.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="admin-accept"
                        onClick={() => {
                          setSelectedUserId(item.userId)
                          setApproveTarget(item)
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="admin-reject"
                        onClick={() => {
                          setSelectedUserId(item.userId)
                          setRejectTarget(item.userId)
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedItem ? (
        <section className="admin-panel admin-panel--kyc-form">
          <AdminKycVerificationForm
            item={selectedItem}
            detail={selectedUserId === selectedItem.userId ? detail : null}
            documentUrls={documentUrls}
            loading={detailLoading && selectedUserId === selectedItem.userId}
            onApprove={
              selectedItem.status === 'pending'
                ? () => setApproveTarget(selectedItem)
                : undefined
            }
            onReject={
              selectedItem.status === 'pending'
                ? () => setRejectTarget(selectedItem.userId)
                : undefined
            }
          />
        </section>
      ) : null}

      <AdminKycApproveDialog
        open={approveTarget !== null}
        businessName={approveBusinessName}
        kycId={approveTarget?.kycId ?? ''}
        onCancel={() => setApproveTarget(null)}
        onConfirm={() => {
          if (approveTarget) void handleDecision(approveTarget.userId, true)
        }}
      />

      <RejectionReasonDialog
        rejectionType="kyc"
        open={rejectTarget !== null}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) void handleDecision(rejectTarget, false, reason)
        }}
      />
    </AdminDashboardShell>
  )
}
