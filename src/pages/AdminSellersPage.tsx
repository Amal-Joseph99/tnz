import { AdminDashboardShell } from '../components/AdminDashboardShell'

const sellers = [
  { id: 'SLR-1042', name: 'AGTRENZ Partner Store', email: 'partner@agtrenz.com', kyc: 'Approved', products: 24, orders: 312, status: 'Active' },
  { id: 'SLR-1038', name: 'Northline Essentials', email: 'ops@northline.in', kyc: 'Pending', products: 0, orders: 0, status: 'Onboarding' },
  { id: 'SLR-1021', name: 'UrbanCraft India', email: 'hello@urbancraft.in', kyc: 'Approved', products: 58, orders: 891, status: 'Active' },
  { id: 'SLR-0994', name: 'GreenLeaf Organics', email: 'support@greenleaf.in', kyc: 'Rejected', products: 0, orders: 14, status: 'Suspended' },
]

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

        <div className="admin-table">
          <div className="admin-table__row admin-table__row--head">
            <span>Seller</span><span>KYC</span><span>Products</span><span>Orders</span><span>Status</span><span>Actions</span>
          </div>
          {sellers.map((seller) => (
            <div key={seller.id} className="admin-table__row">
              <span>
                <strong>{seller.name}</strong>
                <small>{seller.id} · {seller.email}</small>
              </span>
              <span>{seller.kyc}</span>
              <span>{seller.products}</span>
              <span>{seller.orders}</span>
              <strong>{seller.status}</strong>
              <span className="admin-table__actions">
                <button type="button">View</button>
                <button type="button">Message</button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
