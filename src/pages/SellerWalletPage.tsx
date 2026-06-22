import { useEffect, useMemo, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import {
  fetchSellerWalletSummary,
  fetchSellerWalletTransactions,
  formatWalletStatus,
  requestSellerWalletWithdrawal,
  type SellerWalletSummary,
  type SellerWalletTransaction,
} from '../lib/sellerWallet'

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toFixed(2)}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function SellerWalletPage() {
  const [summary, setSummary] = useState<SellerWalletSummary | null>(null)
  const [transactions, setTransactions] = useState<SellerWalletTransaction[]>([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    void Promise.all([fetchSellerWalletSummary(), fetchSellerWalletTransactions()])
      .then(([wallet, rows]) => {
        setSummary(wallet)
        setTransactions(rows)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const currency = summary?.currencyCode ?? 'USD'
  const availableToWithdraw = summary?.availableToWithdraw ?? 0

  const withdrawValue = useMemo(() => {
    const parsed = Number(withdrawAmount)
    return Number.isFinite(parsed) ? parsed : 0
  }, [withdrawAmount])

  const requestWithdrawal = async () => {
    setError('')
    setMessage('')

    if (withdrawValue <= 0) {
      setError('Enter a valid withdrawal amount.')
      return
    }

    if (withdrawValue > availableToWithdraw) {
      setError('Withdrawal amount cannot exceed available to withdraw balance.')
      return
    }

    setSaving(true)
    const result = await requestSellerWalletWithdrawal(withdrawValue)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Withdrawal request submitted successfully.')
    setWithdrawAmount('')
    load()
  }

  return (
    <SellerDashboardShell>
      {error ? <div className="auth-message auth-message--error">{error}</div> : null}
      {message ? <div className="auth-message auth-message--success">{message}</div> : null}

      <section className="seller-wallet-kpis">
        <article>
          <span>Unsettled balance</span>
          <strong>{formatMoney(currency, summary?.unsettledBalance ?? 0)}</strong>
          <p>Orders created and pending fulfillment</p>
        </article>
        <article>
          <span>Available to withdraw</span>
          <strong>{formatMoney(currency, availableToWithdraw)}</strong>
          <p>Delivered orders ready for payout</p>
        </article>
        <article>
          <span>Total sales amount</span>
          <strong>{formatMoney(currency, summary?.totalSalesAmount ?? 0)}</strong>
          <p>Lifetime gross sales</p>
        </article>
        <article>
          <span>Total withdrawn amount</span>
          <strong>{formatMoney(currency, summary?.totalWithdrawnAmount ?? 0)}</strong>
          <p>Lifetime payouts</p>
        </article>
      </section>

      <section className="seller-console-card seller-wallet-withdraw">
        <div className="seller-console-card__header">
          <div>
            <h2>Request withdrawal</h2>
            <p>You can only withdraw from the available to withdraw balance.</p>
          </div>
        </div>
        <div className="seller-wallet-withdraw__row">
          <label>
            Amount ({currency})
            <input
              type="number"
              min="0"
              step="0.01"
              max={availableToWithdraw}
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="seller-primary-action"
            disabled={saving || availableToWithdraw <= 0}
            onClick={() => void requestWithdrawal()}
          >
            {saving ? 'Submitting...' : 'Withdraw'}
          </button>
        </div>
      </section>

      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>All transactions</h2>
            <p>Order-level sales activity in {currency}.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading wallet transactions...</p>
        ) : transactions.length === 0 ? (
          <PanelEmptyState
            title="No transactions yet"
            message="Sales transactions appear after customers place orders."
          />
        ) : (
          <div className="seller-wallet-table-wrap">
            <table className="seller-wallet-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order ID</th>
                  <th>Product name</th>
                  <th>SKU</th>
                  <th>Buyer name</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.transaction_date)}</td>
                    <td>{row.order_number}</td>
                    <td>{row.product_name}</td>
                    <td>{row.sku}</td>
                    <td>{row.buyer_name}</td>
                    <td>{row.quantity}</td>
                    <td>{formatMoney(row.currency_code, row.gross_amount)}</td>
                    <td>
                      <span className={`seller-wallet-status seller-wallet-status--${row.wallet_status}`}>
                        {formatWalletStatus(row.wallet_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SellerDashboardShell>
  )
}
