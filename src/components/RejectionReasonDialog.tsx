import { useEffect, useState } from 'react'
import { fetchRejectionTemplates, type RejectionTemplate } from '../lib/adminApprovals'

type RejectionReasonDialogProps = {
  rejectionType: 'kyc' | 'product'
  open: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function RejectionReasonDialog({
  rejectionType,
  open,
  onCancel,
  onConfirm,
}: RejectionReasonDialogProps) {
  const [templates, setTemplates] = useState<RejectionTemplate[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setLoading(true)
    void fetchRejectionTemplates(rejectionType).then((rows) => {
      setTemplates(rows)
      setSelectedKey(rows[0]?.templateKey ?? '')
      setCustomReason('')
      setLoading(false)
    })
  }, [open, rejectionType])

  if (!open) return null

  const selectedTemplate = templates.find((item) => item.templateKey === selectedKey)
  const reason = customReason.trim() || selectedTemplate?.message || ''

  return (
    <div className="confirm-dialog__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rejection-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rejection-dialog-title">Confirm KYC rejection</h2>
        <p>Select a template or enter a custom reason. The seller will be notified immediately.</p>
        {loading ? (
          <p>Loading rejection templates...</p>
        ) : (
          <>
            <label>
              Template
              <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
                {templates.map((template) => (
                  <option key={template.templateKey} value={template.templateKey}>
                    {template.message}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Custom reason (optional)
              <textarea
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Override or extend the selected template"
              />
            </label>
          </>
        )}
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="confirm-dialog__confirm admin-reject"
            disabled={!reason}
            onClick={() => onConfirm(reason)}
          >
            Confirm rejection
          </button>
        </div>
      </div>
    </div>
  )
}
