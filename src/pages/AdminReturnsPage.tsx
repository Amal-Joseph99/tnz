import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { adminReviewReturn, fetchAdminReturnRequests, type AdminReturnRequest } from '../lib/marketplaceBackend'

export function AdminReturnsPage() {
  const [returns, setReturns] = useState<AdminReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const load = () => {
    void fetchAdminReturnRequests().then((rows) => {
      setReturns(rows)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const review = async (id: number, approve: boolean) => {
    setError('')
    const result = await adminReviewReturn(id, approve, note.trim() || undefined)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setNote('')
    load()
  }

  return (
    <AdminDashboardShell title="Returns" subtitle="Review buyer return requests and process Stripe refunds.">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      <section className="admin-panel">
        <div className="admin-panel__header">
          <h2>Return requests</h2>
          <label>
            Admin note (optional)
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note for buyer" />
          </label>
        </div>
        {loading ? <p>Loading...</p> : returns.length === 0 ? (
          <PanelEmptyState title="No return requests" message="Buyer return requests will appear here." />
        ) : (
          <div className="admin-table">
            {returns.map((row) => (
              <article key={row.id} className="admin-table__row">
                <div>
                  <strong>{row.order_number}</strong>
                  <p>{row.reason}</p>
                  <span>{row.status} · {row.payment_method} · refund: {row.stripe_refund_status}</span>
                </div>
                {row.status === 'requested' && (
                  <div className="admin-toolbar-actions">
                    <button type="button" className="admin-btn" onClick={() => void review(row.id, true)}>Approve</button>
                    <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void review(row.id, false)}>Reject</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminDashboardShell>
  )
}
