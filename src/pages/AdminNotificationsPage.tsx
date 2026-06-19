import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function AdminNotificationsPage() {
  return (
    <AdminDashboardShell
      title="Notifications"
      subtitle="Platform alerts for approvals, disputes, payouts, and compliance."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Admin alerts</h2>
            <p>Operational notifications requiring attention.</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost">Mark all read</button>
        </div>
        <PanelEmptyState
          title="No admin alerts"
          message="KYC, dispute, payout, and compliance alerts will appear here."
        />
      </section>
    </AdminDashboardShell>
  )
}
