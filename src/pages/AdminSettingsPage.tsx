import { AdminDashboardShell } from '../components/AdminDashboardShell'

export function AdminSettingsPage() {
  return (
    <AdminDashboardShell
      title="Settings"
      subtitle="Configure marketplace policies, fees, notifications, and platform controls."
    >
      <div className="admin-settings-grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Marketplace fees</h2>
            <p>Commission and settlement configuration.</p>
          </div>
          <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Default commission (%)
              <input type="number" placeholder="12" min={0} max={100} />
            </label>
            <label>
              Settlement window (days)
              <input type="number" placeholder="7" min={1} />
            </label>
            <button type="submit" className="admin-btn">Save fees</button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Approval policies</h2>
            <p>KYC and product listing review rules.</p>
          </div>
          <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
            <label><input type="checkbox" defaultChecked /> Require admin approval for new sellers</label>
            <label><input type="checkbox" defaultChecked /> Require admin approval for new product listings</label>
            <label><input type="checkbox" /> Auto-approve trusted sellers</label>
            <button type="submit" className="admin-btn">Save policies</button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Platform alerts</h2>
            <p>Admin notification routing.</p>
          </div>
          <form className="admin-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Operations email
              <input type="email" placeholder="ops@agtrenz.com" />
            </label>
            <label><input type="checkbox" defaultChecked /> Email on new KYC submissions</label>
            <label><input type="checkbox" defaultChecked /> Email on order disputes</label>
            <button type="submit" className="admin-btn">Save alerts</button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <h2>Security</h2>
            <p>Admin access and session controls.</p>
          </div>
          <div className="admin-security-list">
            <div><span>Two-factor authentication</span><button type="button">Enable</button></div>
            <div><span>Session timeout</span><strong>Not configured</strong></div>
            <div><span>Last admin login</span><strong>—</strong></div>
          </div>
        </section>
      </div>
    </AdminDashboardShell>
  )
}
