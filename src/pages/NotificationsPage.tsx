import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function NotificationsPage() {
  return (
    <BuyerAccountShell
      title="Notifications"
      subtitle="Stay updated on orders, offers, seller messages, and account alerts."
      action={<button type="button" className="buyer-account__action buyer-account__action--ghost">Mark all read</button>}
    >
      <div className="buyer-workspace">
        <section className="buyer-panel">
          <div className="buyer-tabs" role="tablist" aria-label="Notification filters">
            <button type="button" className="buyer-tabs__item buyer-tabs__item--active">All</button>
            <button type="button" className="buyer-tabs__item">Orders</button>
            <button type="button" className="buyer-tabs__item">Offers</button>
            <button type="button" className="buyer-tabs__item">Account</button>
          </div>

          <PanelEmptyState
            title="No notifications"
            message="Order updates, offers, and account alerts will appear here."
          />
        </section>

        <aside className="buyer-side-panel">
          <h2>Notification preferences</h2>
          <label><input type="checkbox" defaultChecked /> Order updates</label>
          <label><input type="checkbox" defaultChecked /> Offers and deals</label>
          <label><input type="checkbox" defaultChecked /> Account security</label>
          <label><input type="checkbox" /> Marketing emails</label>
          <button type="button" className="buyer-account__action">Update preferences</button>
        </aside>
      </div>
    </BuyerAccountShell>
  )
}
