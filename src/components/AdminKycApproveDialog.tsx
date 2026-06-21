type AdminKycApproveDialogProps = {
  open: boolean
  businessName: string
  kycId: string
  onCancel: () => void
  onConfirm: () => void
}

export function AdminKycApproveDialog({
  open,
  businessName,
  kycId,
  onCancel,
  onConfirm,
}: AdminKycApproveDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="kyc-approve-dialog-title"
        aria-describedby="kyc-approve-dialog-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="kyc-approve-dialog-title">Confirm KYC approval</h2>
        <p id="kyc-approve-dialog-message">
          Approve KYC submission <strong>{kycId}</strong> for <strong>{businessName}</strong>?
          The seller will be notified immediately.
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-dialog__confirm admin-accept" onClick={onConfirm}>
            Confirm approval
          </button>
        </div>
      </div>
    </div>
  )
}
