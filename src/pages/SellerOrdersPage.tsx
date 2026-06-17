import { SellerDashboardShell } from '../components/SellerDashboardShell'

export function SellerOrdersPage() {
  return (
    <SellerDashboardShell title="Orders" subtitle="Track confirmed, packed, shipped, delivered, and return orders.">
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Order queue</h2>
            <p>Prioritized by dispatch deadline.</p>
          </div>
          <button type="button">Download report</button>
        </div>
        <div className="seller-table">
          <div className="seller-table__row seller-table__row--head"><span>Order</span><span>Items</span><span>Deadline</span><span>Status</span></div>
          <div className="seller-table__row"><span>#AGT-20491</span><span>2 items</span><span>Today, 5 PM</span><strong>Pack now</strong></div>
          <div className="seller-table__row"><span>#AGT-20488</span><span>1 item</span><span>Tomorrow</span><strong>Confirmed</strong></div>
          <div className="seller-table__row"><span>#AGT-20482</span><span>4 items</span><span>Today, 3 PM</span><strong>Ready to ship</strong></div>
        </div>
      </section>
    </SellerDashboardShell>
  )
}
