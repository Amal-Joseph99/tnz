import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import {
  fetchKycQueue,
  reviewSellerKyc,
  type KycQueueItem,
} from '../lib/adminApprovals'

export function AdminKycPage() {
  const [queue, setQueue] = useState<KycQueueItem[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadQueue = async (status: string) => {
    setLoading(true)
    const rows = await fetchKycQueue(status === 'all' ? undefined : status)
    setQueue(rows)
    setLoading(false)
  }

  useEffect(() => {
    void loadQueue(filter)
  }, [filter])

  const pending = queue.filter((item) => item.status === 'pending')
  const priority = pending[0]

  const handleDecision = async (userId: string, approved: boolean) => {
    setError('')
    setMessage('')

    const result = await reviewSellerKyc(
      userId,
      approved,
      approved ? undefined : 'Documents or bank details did not pass verification.',
    )

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage(approved ? 'KYC approved.' : 'KYC rejected.')
    await loadQueue(filter)
  }

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
          <div className="admin-approval-card">
            <strong>{priority.businessName}</strong>
            <p>KYC ID: {priority.kycId}</p>
            <p>Seller: {priority.sellerEmail} · {priority.countryName}</p>
            <p>Business type: {priority.businessType}</p>
            <p>Documents: Photo, Address proof, Tax ID proof</p>
            <p>Bank: {priority.bankName} · {priority.accountHolderName}</p>
            <div className="admin-approval-card__actions">
              <button type="button" className="admin-accept" onClick={() => void handleDecision(priority.userId, true)}>Approve KYC</button>
              <button type="button" className="admin-reject" onClick={() => void handleDecision(priority.userId, false)}>Reject KYC</button>
            </div>
          </div>
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
                  {item.status === 'pending' && (
                    <>
                      <button type="button" className="admin-accept" onClick={() => void handleDecision(item.userId, true)}>Approve</button>
                      <button type="button" className="admin-reject" onClick={() => void handleDecision(item.userId, false)}>Reject</button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
