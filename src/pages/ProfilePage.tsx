import { useEffect, useState } from 'react'
import { BuyerAccountShell } from '../components/BuyerAccountShell'
import { PanelEmptyState } from '../components/PanelEmptyState'
import { fetchBuyerAccount, saveBuyerAddress, saveBuyerProfile } from '../lib/marketplaceBackend'
import { supabase } from '../lib/supabase'

export function ProfilePage() {
  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase?.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? '')
      setEmailVerified(Boolean(data.session?.user.email_confirmed_at))
    })
    void fetchBuyerAccount().then(({ profile }) => {
      if (profile) {
        setFullName(profile.full_name)
        setPhone(profile.phone ?? '')
        setDateOfBirth(profile.date_of_birth ?? '')
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setError('')
    setMessage('')
    const result = await saveBuyerProfile({
      fullName,
      phone,
      dateOfBirth: dateOfBirth || undefined,
    })
    if (!result.ok) {
      setError(result.message)
      return
    }
    setMessage('Profile saved.')
  }

  const handleSaveDefaultAddress = async () => {
    if (!fullName.trim() || !phone.trim()) {
      setError('Add your name and phone before saving a default address.')
      return
    }

    const result = await saveBuyerAddress({
      label: 'Default',
      fullName,
      phone,
      addressLine1: 'Update during checkout',
      city: 'Pending',
      state: 'Pending',
      postcode: '000000',
      countryIso2: 'IN',
      isDefault: true,
    })

    if (!result.ok) {
      setError(result.message)
      return
    }

    setMessage('Default address placeholder saved. Complete it during checkout.')
  }

  return (
    <BuyerAccountShell
      title="Profile"
      subtitle="Manage your personal information, saved addresses, and account security."
      action={<button type="button" className="buyer-account__action" onClick={() => void handleSave()}>Save changes</button>}
    >
      {loading && <p>Loading profile...</p>}
      {error && <div className="auth-message auth-message--error">{error}</div>}
      {message && <div className="auth-message auth-message--success">{message}</div>}

      <section className="buyer-panel">
        <div className="buyer-panel__header">
          <h2>Personal information</h2>
          <p>Keep your details accurate for faster checkout and delivery updates.</p>
        </div>
        <form className="buyer-form buyer-form--grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            Full name
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter your full name" />
          </label>
          <label>
            Email address
            <input type="email" value={email} readOnly />
          </label>
          <label>
            Phone number
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter your phone number" />
          </label>
          <label>
            Date of birth
            <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
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
            message="Add a delivery address during checkout or save a default placeholder here."
          />
          <button type="button" onClick={() => void handleSaveDefaultAddress()}>Save default placeholder</button>
        </section>

        <section className="buyer-panel">
          <div className="buyer-panel__header">
            <h2>Security</h2>
            <p>Review login and password settings.</p>
          </div>
          <div className="buyer-security-list">
            <div>
              <span>Password</span>
              <a href="/buyer/forgot-password">Change</a>
            </div>
            <div>
              <span>Email verification</span>
              <strong className="buyer-status">{emailVerified ? 'Verified' : 'Pending'}</strong>
            </div>
          </div>
        </section>
      </div>
    </BuyerAccountShell>
  )
}
