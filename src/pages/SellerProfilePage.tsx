import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LocationIcon } from '../components/Icons'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { detectLocationWithOpenCage } from '../lib/opencage'
import { fetchSellerCountryOptions, type SellerCountryOption } from '../lib/sellerCountries'
import {
  fetchSellerAccountProfile,
  fetchSellerKycDocuments,
  fetchSellerKycSubmission,
  kycDocumentKey,
  submitSellerKyc,
  type KycDocumentSlot,
  type KycDocumentType,
  type SellerKycDocument,
} from '../lib/sellerKyc'
import { uploadKycDocument } from '../lib/sellerStorage'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'

const kycDocumentSlots: Array<{ title: string; documentType: KycDocumentType; required: boolean }> = [
  { title: 'Seller photo', documentType: 'photo', required: true },
  { title: 'Individual address proof', documentType: 'individual_address_proof', required: true },
  { title: 'Business address proof', documentType: 'business_address_proof', required: true },
  { title: 'Tax certificate', documentType: 'tax_certificate', required: false },
]

const uploadSlots: KycDocumentSlot[] = [1, 2]

function RequiredMark() {
  return <span className="kyc-form-required" aria-hidden="true"> *</span>
}

export function SellerProfilePage() {
  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [profile, setProfile] = useState({ businessName: '', email: '', countryName: '', phone: '' })
  const [countries, setCountries] = useState<SellerCountryOption[]>([])
  const [businessType, setBusinessType] = useState('Individual')
  const [businessName, setBusinessName] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [contactFullName, setContactFullName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [stateProvince, setStateProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [addressCountry, setAddressCountry] = useState('')
  const [taxId, setTaxId] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscSwift, setIfscSwift] = useState('')
  const [documents, setDocuments] = useState<SellerKycDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [termsAndPoliciesAccepted, setTermsAndPoliciesAccepted] = useState(false)
  const [sellerAgreementAccepted, setSellerAgreementAccepted] = useState(false)
  const [shippingReturnPolicyAccepted, setShippingReturnPolicyAccepted] = useState(false)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
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
      fetchSellerCountryOptions(),
    ])
      .then(([workflowState, accountProfile, kycSubmission, kycDocuments, countryOptions]) => {
        if (!active) return

        setWorkflow(workflowState)
        setCountries(countryOptions)

        if (accountProfile) {
          setProfile(accountProfile)
          setContactFullName(kycSubmission?.contactFullName || accountProfile.businessName)
          setContactPhone(kycSubmission?.contactPhone || accountProfile.phone)
          setBusinessName(kycSubmission?.businessName || accountProfile.businessName)
          setAccountHolderName(kycSubmission?.accountHolderName || accountProfile.businessName)
          setAddressCountry(kycSubmission?.addressCountry || accountProfile.countryName)
        }

        if (kycSubmission) {
          setBusinessType(kycSubmission.businessType)
          setBusinessName(kycSubmission.businessName)
          setBusinessAddress(kycSubmission.businessAddress)
          setContactFullName(kycSubmission.contactFullName)
          setContactPhone(kycSubmission.contactPhone)
          setStreetAddress(kycSubmission.streetAddress)
          setAddressLine2(kycSubmission.addressLine2)
          setCity(kycSubmission.city)
          setStateProvince(kycSubmission.stateProvince)
          setPostalCode(kycSubmission.postalCode)
          setAddressCountry(kycSubmission.addressCountry)
          setTaxId(kycSubmission.taxId)
          setAccountHolderName(kycSubmission.accountHolderName)
          setBankName(kycSubmission.bankName)
          setAccountNumber(kycSubmission.accountNumber)
          setIfscSwift(kycSubmission.ifscSwift)
          setRejectionReason(kycSubmission.rejectionReason)
        }

        setDocuments(kycDocuments)
        const progress: Record<string, number> = {}
        for (const slot of kycDocumentSlots) {
          for (const documentSlot of uploadSlots) {
            const key = kycDocumentKey(slot.documentType, documentSlot)
            progress[key] = kycDocuments.some(
              (doc) => doc.documentType === slot.documentType && doc.documentSlot === documentSlot,
            )
              ? 100
              : 0
          }
        }
        setUploadProgress(progress)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const countryOptions = useMemo(
    () => countries.map((country) => country.country_name),
    [countries],
  )

  const handleUseCurrentLocation = async () => {
    setLocating(true)
    setError('')
    try {
      const detected = await detectLocationWithOpenCage()
      if (!detected) {
        setError('Unable to detect your location. Enter the address manually.')
        return
      }

      setCity(detected.city)
      setStateProvince(detected.state)
      setAddressCountry(detected.country)
    } finally {
      setLocating(false)
    }
  }

  const handleDocumentUpload = async (
    documentType: KycDocumentType,
    documentSlot: KycDocumentSlot,
    file: File,
    required: boolean,
  ) => {
    const progressKey = kycDocumentKey(documentType, documentSlot)
    setError('')
    setUploadProgress((current) => ({ ...current, [progressKey]: 35 }))

    const upload = await uploadKycDocument(documentType, file, documentSlot)
    if (!upload.ok) {
      setUploadProgress((current) => ({ ...current, [progressKey]: 0 }))
      setError(upload.message)
      return
    }

    const nextDocument: SellerKycDocument = {
      documentType,
      documentSlot,
      storagePath: upload.storagePath,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      isRequired: required && documentSlot === 1,
    }

    setDocuments((current) => [
      ...current.filter(
        (doc) => !(doc.documentType === documentType && doc.documentSlot === documentSlot),
      ),
      nextDocument,
    ])
    setUploadProgress((current) => ({ ...current, [progressKey]: 100 }))
  }

  const handleSubmit = async () => {
    setMessage('')
    setError('')
    setSaving(true)

    const result = await submitSellerKyc({
      businessType,
      businessName,
      businessAddress,
      contactFullName,
      contactPhone,
      streetAddress,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      addressCountry,
      taxId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscSwift,
      termsAndPoliciesAccepted,
      sellerAgreementAccepted,
      shippingReturnPolicyAccepted,
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
          <section className="seller-console-card kyc-address-card">
            <div className="seller-console-card__header">
              <div>
                <h2>Contact information</h2>
                <p>Primary contact details for your seller account.</p>
              </div>
              <span className="seller-badge seller-badge--success">Email verified</span>
            </div>
            <form className="checkout-form checkout-form--grid kyc-address-form">
              <label>
                Full name<RequiredMark />
                <input
                  value={contactFullName}
                  disabled={kycLocked}
                  onChange={(event) => setContactFullName(event.target.value)}
                  required
                />
              </label>
              <label>
                Phone number<RequiredMark />
                <input
                  type="tel"
                  value={contactPhone}
                  disabled={kycLocked}
                  onChange={(event) => setContactPhone(event.target.value)}
                  required
                />
              </label>
              <label className="checkout-form__full">
                Email<RequiredMark />
                <input type="email" value={profile.email} readOnly />
              </label>
            </form>
          </section>

          <section className="seller-console-card kyc-address-card">
            <div className="seller-console-card__header">
              <div>
                <h2>Address details</h2>
                <p>Your registered individual address for verification.</p>
              </div>
              {!kycLocked && (
                <button
                  type="button"
                  className="kyc-location-btn"
                  disabled={locating}
                  onClick={() => void handleUseCurrentLocation()}
                >
                  <LocationIcon />
                  {locating ? 'Locating…' : 'Use current location'}
                </button>
              )}
            </div>
            <form className="checkout-form checkout-form--grid kyc-address-form">
              <label className="checkout-form__full">
                Street address<RequiredMark />
                <input
                  value={streetAddress}
                  disabled={kycLocked}
                  onChange={(event) => setStreetAddress(event.target.value)}
                  required
                />
              </label>
              <label className="checkout-form__full">
                Apartment, suite, etc. (optional)
                <input
                  value={addressLine2}
                  disabled={kycLocked}
                  onChange={(event) => setAddressLine2(event.target.value)}
                />
              </label>
              <label>
                City<RequiredMark />
                <input value={city} disabled={kycLocked} onChange={(event) => setCity(event.target.value)} required />
              </label>
              <label>
                State / Province<RequiredMark />
                <input
                  value={stateProvince}
                  disabled={kycLocked}
                  onChange={(event) => setStateProvince(event.target.value)}
                  required
                />
              </label>
              <label>
                Postal code<RequiredMark />
                <input
                  value={postalCode}
                  disabled={kycLocked}
                  onChange={(event) => setPostalCode(event.target.value)}
                  required
                />
              </label>
              <label>
                Country<RequiredMark />
                <select
                  value={addressCountry}
                  disabled={kycLocked}
                  onChange={(event) => setAddressCountry(event.target.value)}
                  required
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </label>
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
                <p>Upload seller photo, individual and business address proofs, and optional tax certificate. Two files allowed per section.</p>
              </div>
            </div>
            <div className="kyc-upload-grid">
              {kycDocumentSlots.map((item) => (
                <article key={item.documentType} className="kyc-upload-card">
                  <div className="kyc-upload-card__icon">{item.title.slice(0, 1)}</div>
                  <strong>{item.title}</strong>
                  <span>{item.required ? 'Required' : 'Optional'}</span>
                  {uploadSlots.map((documentSlot) => {
                    const progressKey = kycDocumentKey(item.documentType, documentSlot)
                    const uploaded = documents.find(
                      (doc) => doc.documentType === item.documentType && doc.documentSlot === documentSlot,
                    )
                    const progress = uploadProgress[progressKey] ?? 0

                    return (
                      <div key={progressKey} className="kyc-upload-slot">
                        <p className="kyc-upload-slot__label">
                          Upload {documentSlot}
                          {item.required && documentSlot === 1 ? <RequiredMark /> : null}
                        </p>
                        <p>{uploaded?.fileName || 'No file selected'}</p>
                        <div className="kyc-progress" aria-label={`${item.title} upload ${documentSlot} progress`}>
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <em>{progress}% uploading</em>
                        {!kycLocked && (
                          <label className="seller-secondary-action">
                            Choose file {documentSlot}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              hidden
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) {
                                  void handleDocumentUpload(
                                    item.documentType,
                                    documentSlot,
                                    file,
                                    item.required,
                                  )
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )
                  })}
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
            <section className="seller-console-card seller-kyc-terms">
              <div className="seller-kyc-terms__list">
                <label className="seller-terms-check">
                  <input
                    type="checkbox"
                    checked={termsAndPoliciesAccepted}
                    onChange={(event) => setTermsAndPoliciesAccepted(event.target.checked)}
                  />
                  <span>
                    I accept the AGTRENZ{' '}
                    <Link to="/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>.
                  </span>
                </label>
                <label className="seller-terms-check">
                  <input
                    type="checkbox"
                    checked={sellerAgreementAccepted}
                    onChange={(event) => setSellerAgreementAccepted(event.target.checked)}
                  />
                  <span>
                    I accept the AGTRENZ{' '}
                    <Link to="/seller-agreement" target="_blank" rel="noreferrer">Seller Agreement</Link>.
                  </span>
                </label>
                <label className="seller-terms-check">
                  <input
                    type="checkbox"
                    checked={shippingReturnPolicyAccepted}
                    onChange={(event) => setShippingReturnPolicyAccepted(event.target.checked)}
                  />
                  <span>
                    I accept the AGTRENZ{' '}
                    <Link to="/shipping-policy" target="_blank" rel="noreferrer">Shipping Policy</Link>
                    {' '}and{' '}
                    <Link to="/refund-policy" target="_blank" rel="noreferrer">Return Policy</Link>.
                  </span>
                </label>
              </div>
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
