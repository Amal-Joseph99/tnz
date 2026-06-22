import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { fetchAdminPlatformSettings, saveAdminPlatformSettings, type PlatformSettings } from '../lib/marketplaceBackend'

const defaultSettings: PlatformSettings = {
    commission_percent: 12,
    settlement_days: 7,
    return_window_days: 14,
    stale_payment_hours: 24,
    ops_email: '',
    notify_kyc_submissions: true,
    notify_order_disputes: true,
    require_seller_kyc_approval: true,
  require_product_approval: true,
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchAdminPlatformSettings().then((data) => {
      if (data) setSettings((current) => ({ ...current, ...data }))
    })
  }, [])

  const save = async () => {
    setError('')
    setMessage('')
    const result = await saveAdminPlatformSettings(settings)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Settings saved.')
  }

  return (
    <AdminDashboardShell title="Settings" subtitle="Configure marketplace policies, fees, notifications, and platform controls.">
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}
      <div className="admin-settings-grid">
        <section className="admin-panel">
          <div className="admin-panel__header"><h2>Marketplace fees</h2></div>
          <div className="admin-form">
            <label>Default commission (%)<input type="number" value={settings.commission_percent} onChange={(e) => setSettings({ ...settings, commission_percent: Number(e.target.value) })} /></label>
            <label>Settlement window (days)<input type="number" value={settings.settlement_days} onChange={(e) => setSettings({ ...settings, settlement_days: Number(e.target.value) })} /></label>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel__header"><h2>Approval policies</h2></div>
          <div className="admin-form">
            <label><input type="checkbox" checked={settings.require_seller_kyc_approval} onChange={(e) => setSettings({ ...settings, require_seller_kyc_approval: e.target.checked })} /> Require admin approval for new sellers</label>
            <label><input type="checkbox" checked={settings.require_product_approval} onChange={(e) => setSettings({ ...settings, require_product_approval: e.target.checked })} /> Require admin approval for new product listings</label>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel__header"><h2>Platform alerts</h2></div>
          <div className="admin-form">
            <label>Operations email<input type="email" value={settings.ops_email ?? ''} onChange={(e) => setSettings({ ...settings, ops_email: e.target.value })} /></label>
            <label><input type="checkbox" checked={settings.notify_kyc_submissions} onChange={(e) => setSettings({ ...settings, notify_kyc_submissions: e.target.checked })} /> Notify on new KYC submissions</label>
            <label><input type="checkbox" checked={settings.notify_order_disputes} onChange={(e) => setSettings({ ...settings, notify_order_disputes: e.target.checked })} /> Notify on order disputes</label>
          </div>
        </section>
        <section className="admin-panel">
          <div className="admin-panel__header"><h2>Checkout & returns</h2></div>
          <div className="admin-form">
            <label>Return window (days)<input type="number" value={settings.return_window_days} onChange={(e) => setSettings({ ...settings, return_window_days: Number(e.target.value) })} /></label>
            <label>Stale payment timeout (hours)<input type="number" value={settings.stale_payment_hours} onChange={(e) => setSettings({ ...settings, stale_payment_hours: Number(e.target.value) })} /></label>
            <button type="button" className="admin-btn" onClick={() => void save()}>Save settings</button>
          </div>
        </section>
      </div>
    </AdminDashboardShell>
  )
}
