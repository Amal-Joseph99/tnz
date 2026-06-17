import { Link } from 'react-router-dom'

export function ProfilePage() {
  return (
    <section className="profile-page">
      <div className="container profile-page__inner">
        <aside className="profile-sidebar" aria-label="Account navigation">
          <div className="profile-sidebar__user">
            <div className="profile-sidebar__avatar">A</div>
            <div>
              <strong>Akhil p</strong>
              <span>akhil@example.com</span>
            </div>
          </div>

          <nav className="profile-sidebar__nav">
            <Link to="/profile" className="profile-sidebar__link profile-sidebar__link--active">
              Profile
            </Link>
            <Link to="/orders" className="profile-sidebar__link">
              Orders
            </Link>
            <Link to="/notifications" className="profile-sidebar__link">
              Notifications
            </Link>
            <Link to="/help" className="profile-sidebar__link">
              Help Center
            </Link>
          </nav>
        </aside>

        <div className="profile-content">
          <div className="profile-content__header">
            <div>
              <span>Account settings</span>
              <h1>Profile</h1>
              <p>Manage your personal information, saved addresses, and account security.</p>
            </div>
            <button type="button">Save changes</button>
          </div>

          <section className="profile-panel">
            <div className="profile-panel__header">
              <h2>Personal information</h2>
              <p>Keep your details accurate for faster checkout and delivery updates.</p>
            </div>

            <form className="profile-form" onSubmit={(event) => event.preventDefault()}>
              <label>
                Full name
                <input type="text" defaultValue="Akhil p" />
              </label>
              <label>
                Email address
                <input type="email" defaultValue="akhil@example.com" />
              </label>
              <label>
                Phone number
                <input type="tel" placeholder="+91 98765 43210" />
              </label>
              <label>
                Date of birth
                <input type="date" />
              </label>
            </form>
          </section>

          <section className="profile-grid">
            <article className="profile-panel">
              <div className="profile-panel__header">
                <h2>Default address</h2>
                <p>Used for delivery estimates and checkout.</p>
              </div>
              <div className="profile-address">
                <strong>Taliparamba, Kerala, India</strong>
                <span>670141</span>
                <button type="button">Edit address</button>
              </div>
            </article>

            <article className="profile-panel">
              <div className="profile-panel__header">
                <h2>Security</h2>
                <p>Review login and password settings.</p>
              </div>
              <div className="profile-security-list">
                <div>
                  <span>Password</span>
                  <button type="button">Change</button>
                </div>
                <div>
                  <span>Email verification</span>
                  <strong>Verified</strong>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </section>
  )
}
