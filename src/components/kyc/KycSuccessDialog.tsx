type KycSuccessDialogProps = {
  open: boolean
  kycId: string
  submittedAt: string
  onClose: () => void
}

export function KycSuccessDialog({ open, kycId, submittedAt, onClose }: KycSuccessDialogProps) {
  if (!open) return null

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleString()
    : new Date().toLocaleString()

  return (
    <div className="kyc-success-dialog" role="dialog" aria-modal="true" aria-labelledby="kyc-success-title">
      <div className="kyc-success-dialog__backdrop" onClick={onClose} />
      <div className="kyc-success-dialog__panel">
        <h2 id="kyc-success-title">KYC submitted successfully</h2>
        <p>
          Your KYC details have been updated. Please wait for approval — you will be notified when your
          submission is approved or rejected.
        </p>
        <dl className="kyc-success-dialog__meta">
          <div>
            <dt>KYC ID</dt>
            <dd>{kycId}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{formattedDate}</dd>
          </div>
        </dl>
        <button type="button" className="seller-primary-action" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
