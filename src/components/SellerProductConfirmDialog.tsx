type SellerProductConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export function SellerProductConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: SellerProductConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="seller-product-confirm-title"
        aria-describedby="seller-product-confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="seller-product-confirm-title">{title}</h2>
        <p id="seller-product-confirm-message">{message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-dialog__confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
