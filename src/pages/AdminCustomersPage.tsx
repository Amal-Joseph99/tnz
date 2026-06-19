import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function AdminCustomersPage() {
  return (
    <AdminDashboardShell
      title="Customers"
      subtitle="View buyer accounts, order history, and risk flags."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Customer directory</h2>
            <p>Search buyers and review account activity.</p>
          </div>
          <input type="search" placeholder="Search customers..." aria-label="Search customers" />
        </div>
        <PanelEmptyState
          title="No customers yet"
          message="Registered buyer accounts will appear in this directory."
        />
      </section>
    </AdminDashboardShell>
  )
}
