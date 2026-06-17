import { PageShell } from '../components/PageShell'

export function CookiesSettingsPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Cookie Settings"
      subtitle="Control how AGTRENZ uses cookies for essential, analytics, and personalization features."
    >
      <section className="cookie-panel">
        <div className="cookie-option">
          <div><h2>Essential cookies</h2><p>Required for login, cart, checkout, and security.</p></div>
          <strong>Always on</strong>
        </div>
        <label className="cookie-option">
          <div><h2>Analytics cookies</h2><p>Help us understand usage and improve page performance.</p></div>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="cookie-option">
          <div><h2>Personalization cookies</h2><p>Support recommendations, saved preferences, and relevant offers.</p></div>
          <input type="checkbox" defaultChecked />
        </label>
        <button type="button">Save cookie preferences</button>
      </section>
    </PageShell>
  )
}
