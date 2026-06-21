import { WarehouseLocationMap } from './WarehouseLocationMap'

type WarehouseConfirmLocationDialogProps = {
  open: boolean
  locationLabel: string
  latitude: number
  longitude: number
  onCancel: () => void
  onConfirm: () => void
}

export function WarehouseConfirmLocationDialog({
  open,
  locationLabel,
  latitude,
  longitude,
  onCancel,
  onConfirm,
}: WarehouseConfirmLocationDialogProps) {
  if (!open) return null

  const [primaryLabel, ...rest] = locationLabel.split(',').map((part) => part.trim())
  const secondaryLabel = rest.join(', ')

  return (
    <div className="confirm-dialog__backdrop warehouse-confirm-location__backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog warehouse-confirm-location"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-confirm-location-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="warehouse-confirm-location__header">
          <h2 id="warehouse-confirm-location-title">Confirm Location</h2>
          <button type="button" className="warehouse-confirm-location__close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <WarehouseLocationMap latitude={latitude} longitude={longitude} locationLabel={locationLabel} />

        <div className="warehouse-confirm-location__address">
          <strong>{primaryLabel || locationLabel}</strong>
          {secondaryLabel ? <p>{secondaryLabel}</p> : null}
        </div>

        <button type="button" className="warehouse-confirm-location__confirm" onClick={onConfirm}>
          Confirm location
        </button>
      </div>
    </div>
  )
}
