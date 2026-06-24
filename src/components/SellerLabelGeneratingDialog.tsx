import { SELLER_LABEL_GENERATING_MESSAGE } from '../lib/marketplaceOrders'

type SellerLabelGeneratingDialogProps = {
  open: boolean
  onClose: () => void
}

export function SellerLabelGeneratingDialog({ open, onClose }: SellerLabelGeneratingDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-label-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="seller-label-dialog-title">Shipping label</h2>
        <p>{SELLER_LABEL_GENERATING_MESSAGE}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__confirm" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
