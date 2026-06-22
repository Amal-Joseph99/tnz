import { useEffect, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchSellerLedger, fetchSellerWalletSummary, requestSellerPayout } from '../lib/marketplaceBackend'

export function SellerWalletPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof fetchSellerWalletSummary>>>(null)
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof fetchSellerLedger>>>([])
  const [payoutAmount, setPayoutAmount] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    void Promise.all([fetchSellerWalletSummary(), fetchSellerLedger()]).then(([wallet, entries]) => {
      setSummary(wallet)
      setLedger(entries)
    })
  }

  useEffect(() => { load() }, [])

  const requestPayout = async () => {
    setError('')
    setMessage('')
    const amount = Number(payoutAmount)
    const result = await requestSellerPayout(amount)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Payout requested successfully.')
    setPayoutAmount('')
    load()
  }

  const currency = summary?.currencyCode ?? 'USD'

  return (
    <SellerDashboardShell>
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}
      <section className="seller-kpi-grid seller-kpi-grid--three">
        <article><span>Available balance</span><strong>{currency} {Number(summary?.availableBalance ?? 0).toFixed(2)}</strong></article>
        <article><span>Pending settlement</span><strong>{currency} {Number(summary?.pendingBalance ?? 0).toFixed(2)}</strong></article>
        <article><span>Marketplace fees</span><strong>{currency} {Number(summary?.totalFees ?? 0).toFixed(2)}</strong></article>
      </section>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div><h2>Request payout</h2><p>Withdraw available balance to your registered payout method.</p></div>
        </div>
        <label>
          Amount ({currency})
          <input type="number" min="0" step="0.01" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
        </label>
        <button type="button" className="seller-btn" onClick={() => void requestPayout()}>Request payout</button>
      </section>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div><h2>Recent transactions</h2><p>Payouts and order settlements.</p></div>
        </div>
        {ledger.length === 0 ? (
          <PanelEmptyState title="No transactions yet" message="Settlements appear after orders are delivered." />
        ) : (
          <div className="admin-table">
            {ledger.map((entry) => (
              <article key={entry.id} className="admin-table__row">
                <div>
                  <strong>{entry.entry_type}</strong>
                  <p>{entry.description ?? '—'}</p>
                </div>
                <div>
                  <span>{entry.currency_code} {Number(entry.amount).toFixed(2)}</span>
                  <span>{entry.status}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </SellerDashboardShell>
  )
}
