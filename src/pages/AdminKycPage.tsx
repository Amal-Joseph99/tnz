import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
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

export function AdminKycPage() {
  const [queue, setQueue] = useState<KycQueueItem[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<KycDetail | null>(null)
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({})
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  const loadQueue = async (status: string) => {
    setLoading(true)
    const rows = await fetchKycQueue(status === 'all' ? undefined : status)
    setQueue(rows)
    setLoading(false)
  }

  useEffect(() => {
    void loadQueue(filter)
  }, [filter])

  useEffect(() => {
    if (!selectedUserId) {
      setDetail(null)
      setDocumentUrls({})
      return
    }

    void fetchAdminKycDetail(selectedUserId).then(async (nextDetail) => {
      setDetail(nextDetail)
      if (!nextDetail) return

      const urls: Record<string, string> = {}
      await Promise.all(
        nextDetail.documents.map(async (doc) => {
          const url = await getSignedStorageUrl('seller-kyc', doc.storagePath)
          if (url) urls[doc.documentType] = url
        }),
      )
      setDocumentUrls(urls)
    })
  }, [selectedUserId])

  const pending = queue.filter((item) => item.status === 'pending')
  const priority = pending[0]

  useEffect(() => {
    if (priority) {
      setSelectedUserId(priority.userId)
    }
  }, [priority?.userId])

  const handleDecision = async (userId: string, approved: boolean, rejectionReason?: string) => {
    setError('')
    setMessage('')

    const result = await reviewSellerKyc(userId, approved, rejectionReason)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'KYC approved.' : 'KYC rejected.')
    setRejectTarget(null)
    if (selectedUserId === userId) {
      setSelectedUserId(null)
    }
    await loadQueue(filter)
  }

  const renderDetail = (item: KycQueueItem, detailData: KycDetail | null) => (
    <div className="admin-approval-card">
      <strong>{item.businessName}</strong>
      <p>KYC ID: {item.kycId}</p>
      <p>Seller: {item.sellerEmail} · {item.countryName}</p>
      <p>Business type: {item.businessType}</p>
      <p>Business address: {item.businessAddress}</p>
      <p>Tax ID: {item.taxId || 'Not provided'}</p>
      <p>Bank: {item.bankName} · {item.accountHolderName}</p>
      <p>Account: {item.accountNumber} · {item.ifscSwift}</p>
      {detailData && (
        <div className="admin-document-grid">
          {detailData.documents.map((doc) => (
            <article key={doc.documentType}>
              <strong>{doc.documentType}</strong>
              <p>{doc.fileName}</p>
              {documentUrls[doc.documentType] ? (
                <a href={documentUrls[doc.documentType]} target="_blank" rel="noreferrer">View document</a>
              ) : (
                <span>Preview unavailable</span>
              )}
            </article>
          ))}
        </div>
      )}
      {item.status === 'pending' && (
        <div className="admin-approval-card__actions">
          <button type="button" className="admin-accept" onClick={() => void handleDecision(item.userId, true)}>Approve KYC</button>
          <button type="button" className="admin-reject" onClick={() => setRejectTarget(item.userId)}>Reject KYC</button>
        </div>
      )}
    </div>
  )

  return (
    <AdminDashboardShell
      title="KYC Approvals"
      subtitle="Review seller identity, business documents, and bank verification."
    >
      {priority && (
        <section className="admin-panel admin-panel--highlight">
          <div className="admin-panel__header">
            <h2>Priority review</h2>
            <p>Active submission awaiting admin decision.</p>
          </div>
          {renderDetail(priority, selectedUserId === priority.userId ? detail : null)}
        </section>
      )}

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
              <span>KYC ID</span><span>Seller</span><span>Business</span><span>Status</span><span>Actions</span>
            </div>
            {queue.map((item) => (
              <div className="admin-table__row" key={item.userId}>
                <span>{item.kycId}</span>
                <span>{item.sellerEmail}</span>
                <span>{item.businessName}</span>
                <span>{item.status}</span>
                <span className="admin-form__actions">
                  <button type="button" onClick={() => setSelectedUserId(item.userId)}>View</button>
                  {item.status === 'pending' && (
                    <>
                      <button type="button" className="admin-accept" onClick={() => void handleDecision(item.userId, true)}>Approve</button>
                      <button type="button" className="admin-reject" onClick={() => setRejectTarget(item.userId)}>Reject</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedUserId && detail && (
        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>KYC detail</h2>
            <p>Documents and bank verification for selected seller.</p>
          </div>
          {renderDetail(
            queue.find((item) => item.userId === selectedUserId) ?? {
              userId: selectedUserId,
              kycId: String(detail.submission.kyc_id ?? ''),
              status: String(detail.submission.status ?? ''),
              businessType: String(detail.submission.business_type ?? ''),
              businessName: String(detail.submission.business_name ?? ''),
              businessAddress: String(detail.submission.business_address ?? ''),
              taxId: detail.submission.tax_id ? String(detail.submission.tax_id) : null,
              accountHolderName: String(detail.submission.account_holder_name ?? ''),
              bankName: String(detail.submission.bank_name ?? ''),
              accountNumber: String(detail.submission.account_number ?? ''),
              ifscSwift: String(detail.submission.ifsc_swift ?? ''),
              submittedAt: '',
              reviewedAt: null,
              rejectionReason: null,
              sellerEmail: detail.sellerEmail,
              signupBusinessName: detail.signupBusinessName,
              countryName: detail.countryName,
              phone: detail.phone,
            },
            detail,
          )}
        </section>
      )}

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
