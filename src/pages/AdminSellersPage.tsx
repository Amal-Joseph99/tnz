import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function AdminSellersPage() {
  return (
    <AdminDashboardShell
      title="Sellers"
      subtitle="Manage seller accounts, onboarding status, and marketplace participation."
    >
      <section className="admin-panel">
        <div className="admin-panel__header admin-panel__header--toolbar">
          <div>
            <h2>Seller directory</h2>
            <p>Search, filter, and review seller performance and compliance.</p>
          </div>
          <div className="admin-toolbar-actions">
            <input type="search" placeholder="Search sellers..." aria-label="Search sellers" />
            <select aria-label="Filter seller status">
              <option>All statuses</option>
              <option>Active</option>
              <option>Onboarding</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>
        <PanelEmptyState
          title="No sellers yet"
          message="Seller accounts will appear here after registration and onboarding."
        />
      </section>
    </AdminDashboardShell>
  )
}
