import { useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { createKycId, getSellerWorkflow, updateSellerWorkflow } from '../lib/sellerWorkflow'

const uploadItems = [
  { title: 'Photo', file: 'seller-photo.jpg', progress: 86, required: true },
  { title: 'Address proof', file: 'address-proof.pdf', progress: 72, required: true },
  { title: 'Tax ID proof', file: 'tax-id-proof.pdf', progress: 48, required: false },
]

export function SellerProfilePage() {
  const [workflow, setWorkflow] = useState(getSellerWorkflow)
  const [businessType, setBusinessType] = useState('Individual')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setMessage('')
    setError('')

    if (!termsAccepted) {
      setError('Accept the seller terms and conditions before submitting KYC.')
      return
    }

    const kycId = createKycId()
    const nextWorkflow = updateSellerWorkflow((state) => ({
      ...state,
      kycId,
      kycStatus: 'pending',
      warehouseCompleted: false,
      productApprovalStatus: 'none',
      productName: '',
    }))

    setWorkflow(nextWorkflow)
    setMessage(`KYC submitted successfully. Generated KYC ID: ${kycId}. Waiting for admin approval.`)
  }

  return (
    <SellerDashboardShell title="Seller Profile & KYC" subtitle="Complete KYC verification before warehouse setup and product listing.">
      <section className="seller-console-grid seller-console-grid--kyc">
        <div className="seller-kyc-main">
          <section className="seller-console-card">
            <div className="seller-console-card__header">
              <div>
                <h2>Personal details</h2>
                <p>Details captured during seller signup.</p>
              </div>
              <span className="seller-badge seller-badge--success">Email verified</span>
            </div>
            <form className="seller-console-form">
              <label>Business name<input defaultValue="AGTRENZ Partner Store" readOnly /></label>
              <label>Email<input defaultValue="seller@example.com" readOnly /></label>
              <label>Country<input defaultValue="India" readOnly /></label>
              <label>Mobile number<input defaultValue="+91 98765 43210" readOnly /></label>
            </form>
          </section>

          <section className="seller-console-card">
            <div className="seller-console-card__header">
              <div>
                <h2>Business details</h2>
                <p>Tax ID is optional for individual sellers.</p>
              </div>
            </div>
            <form className="seller-console-form">
              <label>
                Type of business
                <select value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
                  <option>Individual</option>
                  <option>Proprietorship</option>
                  <option>Partnership</option>
                  <option>Private Limited</option>
                  <option>LLP</option>
                </select>
              </label>
              <label>Business name<input defaultValue="AGTRENZ Partner Store" /></label>
              <label className="seller-console-form__full">Business address<textarea defaultValue="Taliparamba, Kannur, Kerala, India" /></label>
              <label>
                Tax ID {businessType === 'Individual' ? '(optional)' : ''}
                <input placeholder="Enter GST/VAT/Tax ID" />
              </label>
            </form>
          </section>

          <section className="seller-console-card">
            <div className="seller-console-card__header">
              <div>
                <h2>KYC document gallery upload</h2>
                <p>Upload identity, address, and tax documents. Progress is visible for every file.</p>
              </div>
            </div>
            <div className="kyc-upload-grid">
              {uploadItems.map((item) => (
                <article key={item.title} className="kyc-upload-card">
                  <div className="kyc-upload-card__icon">{item.title.slice(0, 1)}</div>
                  <strong>{item.title}</strong>
                  <span>{item.required ? 'Required' : 'Optional'}</span>
                  <p>{item.file}</p>
                  <div className="kyc-progress" aria-label={`${item.title} upload progress`}>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <em>{item.progress}% uploading</em>
                </article>
              ))}
            </div>
          </section>

          <section className="seller-console-card">
            <div className="seller-console-card__header">
              <div>
                <h2>Bank account details</h2>
                <p>Used for seller payouts after order settlement.</p>
              </div>
            </div>
            <form className="seller-console-form">
              <label>Account holder name<input defaultValue="AGTRENZ Partner Store" /></label>
              <label>Bank name<input placeholder="Enter bank name" /></label>
              <label>Account number<input placeholder="Enter account number" /></label>
              <label>IFSC / SWIFT<input placeholder="Enter IFSC or SWIFT code" /></label>
            </form>
          </section>

          <section className="seller-console-card">
            <label className="seller-terms-check">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
              <span>I accept the AGTRENZ seller terms, KYC policy, and document verification conditions.</span>
            </label>
            {error && <div className="auth-message auth-message--error">{error}</div>}
            {message && <div className="auth-message auth-message--success">{message}</div>}
            <button type="button" className="seller-primary-action" onClick={handleSubmit}>
              Generate KYC ID & Submit
            </button>
          </section>
        </div>

        <aside className="seller-console-card seller-kyc-status">
          <h2>KYC status overview</h2>
          <div className="seller-status-list">
            <div><strong>KYC ID</strong><span>{workflow.kycId || 'Not generated'}</span></div>
            <div><strong>Status</strong><span>{workflow.kycStatus.replace('_', ' ')}</span></div>
            <div><strong>Warehouse</strong><span>{workflow.kycStatus === 'approved' ? 'Unlocked' : 'Locked'}</span></div>
            <div><strong>Product listing</strong><span>{workflow.warehouseCompleted ? 'Allowed with admin approval' : 'Locked'}</span></div>
          </div>
          <div className="seller-kyc-note">
            <strong>Approval flow</strong>
            <p>Admin must approve KYC. After approval, seller fills warehouse address. Product listings then require admin approval before public visibility.</p>
          </div>
        </aside>
      </section>
    </SellerDashboardShell>
  )
}
