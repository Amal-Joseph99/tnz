import { useEffect, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import {
  fetchSellerAccountProfile,
  fetchSellerKycDocuments,
  fetchSellerKycSubmission,
  submitSellerKyc,
  type KycDocumentType,
  type SellerKycDocument,
} from '../lib/sellerKyc'
import { uploadKycDocument } from '../lib/sellerStorage'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

const kycDocumentSlots: Array<{ title: string; documentType: KycDocumentType; required: boolean }> = [
  { title: 'Photo', documentType: 'photo', required: true },
  { title: 'Address proof', documentType: 'address_proof', required: true },
  { title: 'Tax ID proof', documentType: 'tax_id_proof', required: false },
]

export function SellerProfilePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [profile, setProfile] = useState({ businessName: '', email: '', countryName: '', phone: '' })
  const [businessType, setBusinessType] = useState('Individual')
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscSwift, setIfscSwift] = useState('')
  const [documents, setDocuments] = useState<SellerKycDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<KycDocumentType, number>>({
    photo: 0,
    address_proof: 0,
    tax_id_proof: 0,
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const kycLocked = workflow?.kycStatus === 'pending' || workflow?.kycStatus === 'approved'

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchSellerAccountProfile(),
      fetchSellerKycSubmission(),
      fetchSellerKycDocuments(),
    ])
      .then(([workflowState, accountProfile, kycSubmission, kycDocuments]) => {
        if (!active) return

        setWorkflow(workflowState)

        if (accountProfile) {
          setProfile(accountProfile)
          setBusinessName(kycSubmission?.businessName || accountProfile.businessName)
          setAccountHolderName(kycSubmission?.accountHolderName || accountProfile.businessName)
        }

        if (kycSubmission) {
          setBusinessType(kycSubmission.businessType)
          setBusinessName(kycSubmission.businessName)
          setBusinessAddress(kycSubmission.businessAddress)
          setTaxId(kycSubmission.taxId)
          setAccountHolderName(kycSubmission.accountHolderName)
          setBankName(kycSubmission.bankName)
          setAccountNumber(kycSubmission.accountNumber)
          setIfscSwift(kycSubmission.ifscSwift)
          setRejectionReason(kycSubmission.rejectionReason)
        }

        setDocuments(kycDocuments)
        setUploadProgress({
          photo: kycDocuments.some((doc) => doc.documentType === 'photo') ? 100 : 0,
          address_proof: kycDocuments.some((doc) => doc.documentType === 'address_proof') ? 100 : 0,
          tax_id_proof: kycDocuments.some((doc) => doc.documentType === 'tax_id_proof') ? 100 : 0,
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleDocumentUpload = async (documentType: KycDocumentType, file: File, required: boolean) => {
    setError('')
    setUploadProgress((current) => ({ ...current, [documentType]: 35 }))

    const upload = await uploadKycDocument(documentType, file)
    if (!upload.ok) {
      setUploadProgress((current) => ({ ...current, [documentType]: 0 }))
      setError(upload.message)
      return
    }

    const nextDocument: SellerKycDocument = {
      documentType,
      storagePath: upload.storagePath,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      isRequired: required,
    }

    setDocuments((current) => [
      ...current.filter((doc) => doc.documentType !== documentType),
      nextDocument,
    ])
    setUploadProgress((current) => ({ ...current, [documentType]: 100 }))
  }

  const handleSubmit = async () => {
    setMessage('')
    setError('')
    setSaving(true)

    const result = await submitSellerKyc({
      businessType,
      businessName,
      businessAddress,
      taxId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscSwift,
      termsAccepted,
      documents,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const nextWorkflow = await fetchSellerWorkflow()
    setWorkflow(nextWorkflow)
    setMessage(`KYC submitted successfully. Generated KYC ID: ${result.kycId}. Waiting for admin approval.`)
  }

  if (loading || !workflow) {
    return (
      <SellerDashboardShell title="Seller Profile & KYC" subtitle="Complete KYC verification before warehouse setup and product listing.">
        <p>Loading seller profile...</p>
      </SellerDashboardShell>
    )
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
              <label>Business name<input value={profile.businessName} readOnly /></label>
              <label>Email<input value={profile.email} readOnly /></label>
              <label>Country<input value={profile.countryName} readOnly /></label>
              <label>Mobile number<input value={profile.phone} readOnly /></label>
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
                <select value={businessType} disabled={kycLocked} onChange={(event) => setBusinessType(event.target.value)}>
                  <option>Individual</option>
                  <option>Proprietorship</option>
                  <option>Partnership</option>
                  <option>Private Limited</option>
                  <option>LLP</option>
                </select>
              </label>
              <label>Business name<input value={businessName} disabled={kycLocked} onChange={(event) => setBusinessName(event.target.value)} /></label>
              <label className="seller-console-form__full">Business address<textarea value={businessAddress} disabled={kycLocked} onChange={(event) => setBusinessAddress(event.target.value)} /></label>
              <label>
                Tax ID {businessType === 'Individual' ? '(optional)' : ''}
                <input value={taxId} disabled={kycLocked} placeholder="Enter GST/VAT/Tax ID" onChange={(event) => setTaxId(event.target.value)} />
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
              {kycDocumentSlots.map((item) => {
                const uploaded = documents.find((doc) => doc.documentType === item.documentType)
                const progress = uploadProgress[item.documentType]

                return (
                  <article key={item.title} className="kyc-upload-card">
                    <div className="kyc-upload-card__icon">{item.title.slice(0, 1)}</div>
                    <strong>{item.title}</strong>
                    <span>{item.required ? 'Required' : 'Optional'}</span>
                    <p>{uploaded?.fileName || 'No file selected'}</p>
                    <div className="kyc-progress" aria-label={`${item.title} upload progress`}>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <em>{progress}% uploading</em>
                    {!kycLocked && (
                      <label className="seller-secondary-action">
                        Choose file
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          hidden
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) void handleDocumentUpload(item.documentType, file, item.required)
                          }}
                        />
                      </label>
                    )}
                  </article>
                )
              })}
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
              <label>Account holder name<input value={accountHolderName} disabled={kycLocked} onChange={(event) => setAccountHolderName(event.target.value)} /></label>
              <label>Bank name<input value={bankName} disabled={kycLocked} placeholder="Enter bank name" onChange={(event) => setBankName(event.target.value)} /></label>
              <label>Account number<input value={accountNumber} disabled={kycLocked} placeholder="Enter account number" onChange={(event) => setAccountNumber(event.target.value)} /></label>
              <label>IFSC / SWIFT<input value={ifscSwift} disabled={kycLocked} placeholder="Enter IFSC or SWIFT code" onChange={(event) => setIfscSwift(event.target.value)} /></label>
            </form>
          </section>

          {workflow.kycStatus === 'rejected' && rejectionReason && (
            <section className="seller-console-card">
              <div className="auth-message auth-message--error">
                KYC rejected: {rejectionReason}. Update your details and resubmit.
              </div>
            </section>
          )}

          {!kycLocked && (
            <section className="seller-console-card">
              <label className="seller-terms-check">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                <span>I accept the AGTRENZ seller terms, KYC policy, and document verification conditions.</span>
              </label>
              {error && <div className="auth-message auth-message--error">{error}</div>}
              {message && <div className="auth-message auth-message--success">{message}</div>}
              <button type="button" className="seller-primary-action" disabled={saving} onClick={() => void handleSubmit()}>
                {saving ? 'Submitting...' : 'Generate KYC ID & Submit'}
              </button>
            </section>
          )}
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
