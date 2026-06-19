import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { PanelEmptyState } from '../components/PanelEmptyState'

export function ProfilePage() {
  return (
    <BuyerAccountShell
      title="Profile"
      subtitle="Manage your personal information, saved addresses, and account security."
      action={<button type="button" className="buyer-account__action">Save changes</button>}
    >
      <section className="buyer-panel">
        <div className="buyer-panel__header">
          <h2>Personal information</h2>
          <p>Keep your details accurate for faster checkout and delivery updates.</p>
        </div>
        <form className="buyer-form buyer-form--grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input type="text" placeholder="Enter your full name" />
          </label>
          <label>
            Email address
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Phone number
            <input type="tel" placeholder="Enter your phone number" />
          </label>
          <label>
            Date of birth
            <input type="date" />
          </label>
        </form>
      </section>

      <div className="buyer-panel-grid">
        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Default address</h2>
            <p>Used for delivery estimates and checkout.</p>
          </div>
          <PanelEmptyState
            title="No saved address"
            message="Add a delivery address during checkout or here in your profile."
          />
        </section>

        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Security</h2>
            <p>Review login and password settings.</p>
          </div>
          <div className="buyer-security-list">
            <div>
              <span>Password</span>
              <button type="button">Change</button>
            </div>
            <div>
              <span>Email verification</span>
              <strong className="buyer-status">Pending</strong>
            </div>
            <div>
              <span>Two-factor authentication</span>
              <button type="button">Enable</button>
            </div>
          </div>
        </section>
      </div>
    </BuyerAccountShell>
  )
}
