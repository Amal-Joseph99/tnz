type StatusMessageDialogProps = {
  open: boolean
  title: string
  message: string
  variant?: 'success' | 'error'
  onClose: () => void
}

export function StatusMessageDialog({
  open,
  title,
  message,
  variant = 'success',
  onClose,
}: StatusMessageDialogProps) {
  if (!open) return null

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="status-dialog-title">{title}</h2>
        <p className={variant === 'error' ? 'auth-message auth-message--error' : 'auth-message auth-message--success'}>
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__confirm" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
