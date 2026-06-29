import { KycUploadField } from '../../components/kyc/KycUploadField'
import { kycDocumentKey, type KycDocumentSlot, type KycDocumentType, type SellerKycDocument } from '../../lib/sellerKyc'
import { KYC_UPLOAD_SECTIONS } from '../../lib/sellerKycWizard'

type KycStep3UploadProps = {
  documents: SellerKycDocument[]
  uploadProgress: Record<string, number>
  disabled: boolean
  onUpload: (documentType: KycDocumentType, documentSlot: KycDocumentSlot, file: File, required: boolean) => Promise<void>
  onDelete: (documentType: KycDocumentType, documentSlot: KycDocumentSlot) => Promise<void>
}

export function KycStep3Upload({
  documents,
  uploadProgress,
  disabled,
  onUpload,
  onDelete,
}: KycStep3UploadProps) {
  return (
    <section className="seller-console-card">
      <div className="seller-console-card__header">
        <div>
          <h2>Upload KYC documents</h2>
          <p>Upload your photo, business address proof (front and back), and optional tax ID.</p>
        </div>
      </div>
      <div className="kyc-upload-grid kyc-upload-grid--wizard">
        {KYC_UPLOAD_SECTIONS.map((section) => (
          <article key={section.documentType} className="kyc-upload-card">
            <div className="kyc-upload-card__head">
              <div className="kyc-upload-card__icon">{section.title.slice(0, 1)}</div>
              <div className="kyc-upload-card__meta">
                <strong>{section.title}</strong>
                <span>{section.required ? 'Required' : 'Optional'}</span>
              </div>
            </div>
            <div
              className={[
                'kyc-upload-card__drops',
                section.slots.length === 1 ? 'kyc-upload-card__drops--single' : '',
                section.documentType === 'photo' ? 'kyc-upload-card__drops--photo' : '',
                section.documentType === 'business_address_proof' ? 'kyc-upload-card__drops--address' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {section.slots.map((slot) => {
                const uploaded = documents.find(
                  (doc) => doc.documentType === section.documentType && doc.documentSlot === slot.slot,
                )
                const progressKey = kycDocumentKey(section.documentType, slot.slot)
                return (
                  <KycUploadField
                    key={progressKey}
                    label={slot.label}
                    required={section.required && slot.slot === 1}
                    previewShape={section.documentType === 'photo' ? 'portrait' : 'document'}
                    documentType={section.documentType}
                    documentSlot={slot.slot}
                    fileName={uploaded?.fileName}
                    mimeType={uploaded?.mimeType}
                    storagePath={uploaded?.storagePath}
                    progress={uploadProgress[progressKey] ?? (uploaded ? 100 : 0)}
                    disabled={disabled}
                    onUpload={(file) => onUpload(section.documentType, slot.slot, file, section.required)}
                    onDelete={() => onDelete(section.documentType, slot.slot)}
                  />
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
