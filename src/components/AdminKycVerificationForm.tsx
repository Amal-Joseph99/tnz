import { Link } from 'react-router-dom'
import {
  formatKycAddress,
  formatKycDocumentLabel,
  KYC_POLICY_ACCEPTANCE_ITEMS,
} from '../lib/sellerKyc'
import type { KycDetail, KycQueueItem } from '../lib/adminApprovals'

type AdminKycVerificationFormProps = {
  item: KycQueueItem
  detail: KycDetail | null
  documentUrls: Record<string, string>
  loading?: boolean
  onApprove?: () => void
  onReject?: () => void
}

function documentPreviewKey(documentType: string, documentSlot?: number) {
  return documentSlot ? `${documentType}:${documentSlot}` : documentType
}

function readSubmissionAddress(
  submission: Record<string, unknown>,
  prefix: 'individual' | 'business',
) {
  if (prefix === 'individual') {
    return formatKycAddress({
      streetAddress: String(submission.street_address ?? ''),
      addressLine2: String(submission.address_line_2 ?? ''),
      city: String(submission.city ?? ''),
      stateProvince: String(submission.state_province ?? ''),
      postalCode: String(submission.postal_code ?? ''),
      addressCountry: String(submission.address_country ?? ''),
    })
  }

  if (submission.business_street_address) {
    return formatKycAddress({
      streetAddress: String(submission.business_street_address ?? ''),
      addressLine2: String(submission.business_address_line_2 ?? ''),
      city: String(submission.business_city ?? ''),
      stateProvince: String(submission.business_state_province ?? ''),
      postalCode: String(submission.business_postal_code ?? ''),
      addressCountry: String(submission.business_address_country ?? ''),
    })
  }

  return String(submission.business_address ?? '')
}

function formatSubmissionDateTime(iso: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="kyc-form-field">
      <span className="kyc-form-field__label">{label}</span>
      <span className="kyc-form-field__value">{value || '—'}</span>
    </div>
  )
}

function PolicyAcceptanceRow({
  label,
  accepted,
  acceptedAt,
}: {
  label: string
  accepted: boolean
  acceptedAt?: string | null
}) {
  return (
    <div className={`kyc-form-policy${accepted ? ' kyc-form-policy--accepted' : ''}`}>
      <span className="kyc-form-policy__box" aria-hidden="true">
        {accepted ? '✓' : ''}
      </span>
      <span className="kyc-form-policy__text">{label}</span>
      {acceptedAt ? (
        <span className="kyc-form-policy__date">{formatSubmissionDateTime(acceptedAt)}</span>
      ) : null}
    </div>
  )
}

export function AdminKycVerificationForm({
  item,
  detail,
  documentUrls,
  loading = false,
  onApprove,
  onReject,
}: AdminKycVerificationFormProps) {
  const submission = detail?.submission ?? {}
  const documents = detail?.documents ?? []
  const photoDoc = documents.find((doc) => doc.documentType === 'photo')
  const photoKey = photoDoc ? documentPreviewKey(photoDoc.documentType, photoDoc.documentSlot) : null
  const photoUrl = photoKey ? documentUrls[photoKey] : null

  const contactName = String(submission.contact_full_name ?? item.signupBusinessName ?? item.businessName)
  const contactPhone = String(submission.contact_phone ?? item.phone)
  const individualAddress = readSubmissionAddress(submission, 'individual') || 'Not provided'
  const businessAddress = readSubmissionAddress(submission, 'business') || item.businessAddress || 'Not provided'
  const submittedAt = item.submittedAt || String(submission.submitted_at ?? '')
  const statusLabel = item.status.replaceAll('_', ' ').toUpperCase()
  const canDecide = item.status === 'pending' && onApprove && onReject

  return (
    <article className="kyc-verification-form">
      <header className="kyc-verification-form__header">
        <h2 className="kyc-verification-form__title">KYC VERIFICATION FORM</h2>
        <div className="kyc-verification-form__meta">
          <div className="kyc-verification-form__meta-left">
            <p>
              <strong>KYC ID:</strong> {item.kycId}
            </p>
            <p>
              <strong>Date &amp; Time:</strong> {formatSubmissionDateTime(submittedAt)}
            </p>
          </div>
          <div className="kyc-verification-form__meta-right">
            <span className={`kyc-verification-form__status kyc-verification-form__status--${item.status}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="kyc-verification-form__loading">Loading verification details...</p>
      ) : (
        <>
          <section className="kyc-verification-form__identity">
            <div className="kyc-verification-form__photo">
              <span className="kyc-form-section__label">Personal photo</span>
              {photoUrl ? (
                <img src={photoUrl} alt={`${contactName} seller photo`} className="kyc-verification-form__photo-img" />
              ) : (
                <div className="kyc-verification-form__photo-placeholder">Photo not available</div>
              )}
            </div>

            <div className="kyc-verification-form__personal">
              <h3 className="kyc-form-section__title">Personal details</h3>
              <FormField label="Full name" value={contactName} />
              <FormField label="Personal address" value={individualAddress} />
              <FormField label="Email" value={item.sellerEmail || detail?.sellerEmail || ''} />
              <FormField label="Mobile no." value={contactPhone} />
              <FormField label="Country" value={item.countryName || detail?.countryName || ''} />
            </div>
          </section>

          <section className="kyc-form-section">
            <h3 className="kyc-form-section__title">Business details</h3>
            <div className="kyc-form-section__grid">
              <FormField label="Business name" value={item.businessName} />
              <FormField label="Business type" value={item.businessType} />
              <FormField
                label="Business address"
                value={
                  submission.business_same_as_individual
                    ? `${businessAddress} (same as individual address)`
                    : businessAddress
                }
              />
              <FormField label="Tax ID / GST" value={item.taxId ?? 'Not provided'} />
            </div>
          </section>

          <section className="kyc-form-section">
            <h3 className="kyc-form-section__title">Account details</h3>
            <div className="kyc-form-section__grid">
              <FormField label="Account holder name" value={item.accountHolderName} />
              <FormField label="Bank name" value={item.bankName} />
              <FormField label="Account number" value={item.accountNumber} />
              <FormField label="IFSC / SWIFT" value={item.ifscSwift} />
            </div>
          </section>

          {documents.length > 0 && (
            <section className="kyc-form-section">
              <h3 className="kyc-form-section__title">Uploaded KYC documents</h3>
              <div className="kyc-form-documents">
                {documents.map((doc) => {
                  const key = documentPreviewKey(doc.documentType, doc.documentSlot)
                  const url = documentUrls[key]
                  const isImage = doc.mimeType?.startsWith('image/')

                  return (
                    <figure key={key} className="kyc-form-documents__item">
                      <figcaption>{formatKycDocumentLabel(doc.documentType, doc.documentSlot)}</figcaption>
                      {url && isImage ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={doc.fileName} />
                        </a>
                      ) : url ? (
                        <a href={url} target="_blank" rel="noreferrer" className="kyc-form-documents__link">
                          View {doc.fileName}
                        </a>
                      ) : (
                        <span className="kyc-form-documents__missing">Preview unavailable</span>
                      )}
                    </figure>
                  )
                })}
              </div>
            </section>
          )}

          <section className="kyc-form-section kyc-form-section--policies">
            <h3 className="kyc-form-section__title">Seller policy acceptances</h3>
            <div className="kyc-form-policies">
              {KYC_POLICY_ACCEPTANCE_ITEMS.map((policy) => {
                const acceptedAt = submission[policy.field] as string | null | undefined
                return (
                  <PolicyAcceptanceRow
                    key={policy.field}
                    label={policy.label}
                    accepted={Boolean(acceptedAt)}
                    acceptedAt={acceptedAt}
                  />
                )
              })}
            </div>
            <p className="kyc-form-policies__note">
              Policy links:{' '}
              <Link to="/terms-of-service" target="_blank" rel="noreferrer">Terms</Link>
              {' · '}
              <Link to="/privacy-policy" target="_blank" rel="noreferrer">Privacy</Link>
              {' · '}
              <Link to="/seller-agreement" target="_blank" rel="noreferrer">Seller Agreement</Link>
              {' · '}
              <Link to="/shipping-policy" target="_blank" rel="noreferrer">Shipping</Link>
              {' · '}
              <Link to="/refund-policy" target="_blank" rel="noreferrer">Returns</Link>
            </p>
          </section>

          {item.status === 'rejected' && item.rejectionReason ? (
            <section className="kyc-form-section kyc-form-section--rejection">
              <h3 className="kyc-form-section__title">Rejection reason</h3>
              <p>{item.rejectionReason}</p>
            </section>
          ) : null}

          {canDecide ? (
            <footer className="kyc-verification-form__actions">
              <button type="button" className="kyc-form-btn kyc-form-btn--approve" onClick={onApprove}>
                Approve KYC
              </button>
              <button type="button" className="kyc-form-btn kyc-form-btn--reject" onClick={onReject}>
                Reject KYC
              </button>
            </footer>
          ) : null}
        </>
      )}
    </article>
  )
}
