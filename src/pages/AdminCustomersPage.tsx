import { AdminDashboardShell } from '../components/AdminDashboardShell'

const customers = [
  { id: 'CUS-8821', name: 'Akhil P', email: 'akhil@example.com', orders: 12, spend: '$842.10', status: 'Active', joined: 'Jan 2025' },
  { id: 'CUS-8794', name: 'Riya Menon', email: 'riya@example.com', orders: 28, spend: '$2,104.00', status: 'Active', joined: 'Nov 2024' },
  { id: 'CUS-8702', name: 'Arjun Nair', email: 'arjun@example.com', orders: 4, spend: '$186.40', status: 'Active', joined: 'Mar 2026' },
  { id: 'CUS-8611', name: 'Sneha Das', email: 'sneha@example.com', orders: 1, spend: '$214.00', status: 'Flagged', joined: 'Jun 2026' },
]

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
        <div className="admin-table">
          <div className="admin-table__row admin-table__row--head">
            <span>Customer</span><span>Email</span><span>Orders</span><span>Lifetime spend</span><span>Status</span><span>Joined</span>
          </div>
          {customers.map((customer) => (
            <div key={customer.id} className="admin-table__row">
              <span><strong>{customer.name}</strong><small>{customer.id}</small></span>
              <span>{customer.email}</span>
              <span>{customer.orders}</span>
              <span>{customer.spend}</span>
              <strong>{customer.status}</strong>
              <span>{customer.joined}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminDashboardShell>
  )
}
