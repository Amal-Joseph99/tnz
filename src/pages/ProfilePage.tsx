import { BuyerAccountShell } from '../components/BuyerAccountShell'

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
            <input type="text" defaultValue="Akhil P" />
          </label>
          <label>
            Email address
            <input type="email" defaultValue="akhil@example.com" />
          </label>
          <label>
            Phone number
            <input type="tel" defaultValue="+91 98765 43210" />
          </label>
          <label>
            Date of birth
            <input type="date" defaultValue="1995-06-12" />
          </label>
        </form>
      </section>

      <div className="buyer-panel-grid">
        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Default address</h2>
            <p>Used for delivery estimates and checkout.</p>
          </div>
          <div className="buyer-address-card">
            <strong>Akhil P</strong>
            <span>12 Market Road, Taliparamba</span>
            <span>Kannur, Kerala 670141</span>
            <span>+91 98765 43210</span>
            <button type="button">Edit address</button>
          </div>
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
              <strong className="buyer-status buyer-status--success">Verified</strong>
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
