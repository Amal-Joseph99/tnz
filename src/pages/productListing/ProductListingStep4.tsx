import { ProductListingWizardNav } from '../../components/productListing/ProductListingWizardShell'
import { useProductListingDraft } from '../../context/ProductListingDraftContext'
import { validateStep4 } from '../../lib/productListingWizard'

type Step4Props = {
  onBack: () => void
  onNext: () => void
}

function YesNoGroup({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="listing-yes-no">
      <legend>{label}</legend>
      <label>
        <input type="radio" checked={value} disabled={disabled} onChange={() => onChange(true)} />
        Yes
      </label>
      <label>
        <input type="radio" checked={!value} disabled={disabled} onChange={() => onChange(false)} />
        No
      </label>
    </fieldset>
  )
}

export function ProductListingStep4({ onBack, onNext }: Step4Props) {
  const { draft, options, setDraft, isReadOnly, saving } = useProductListingDraft()

  const lengthUnit = options.dimensionUnits[0]?.code ?? ''
  const weightUnit = options.weightUnits[0]?.code ?? ''

  return (
    <section className="seller-console-card listing-step">
      <div className="listing-step__section">
        <h2>Package dimensions</h2>
        <div className="listing-form-grid">
          <label>
            Package length
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={isReadOnly}
              value={draft.packageLength || ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  packageLength: Number(event.target.value),
                  packageLengthUnitCode: current.packageLengthUnitCode || lengthUnit,
                }))
              }
            />
          </label>
          <label>
            Unit
            <select
              disabled={isReadOnly}
              value={draft.packageLengthUnitCode || lengthUnit}
              onChange={(event) => setDraft((current) => ({ ...current, packageLengthUnitCode: event.target.value }))}
            >
              {options.dimensionUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>{unit.label}</option>
              ))}
            </select>
          </label>
          <label>
            Package width
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={isReadOnly}
              value={draft.packageWidth || ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  packageWidth: Number(event.target.value),
                  packageWidthUnitCode: current.packageWidthUnitCode || lengthUnit,
                }))
              }
            />
          </label>
          <label>
            Unit
            <select
              disabled={isReadOnly}
              value={draft.packageWidthUnitCode || lengthUnit}
              onChange={(event) => setDraft((current) => ({ ...current, packageWidthUnitCode: event.target.value }))}
            >
              {options.dimensionUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>{unit.label}</option>
              ))}
            </select>
          </label>
          <label>
            Package height
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={isReadOnly}
              value={draft.packageHeight || ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  packageHeight: Number(event.target.value),
                  packageHeightUnitCode: current.packageHeightUnitCode || lengthUnit,
                }))
              }
            />
          </label>
          <label>
            Unit
            <select
              disabled={isReadOnly}
              value={draft.packageHeightUnitCode || lengthUnit}
              onChange={(event) => setDraft((current) => ({ ...current, packageHeightUnitCode: event.target.value }))}
            >
              {options.dimensionUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>{unit.label}</option>
              ))}
            </select>
          </label>
          <label>
            Package weight
            <input
              type="number"
              min="0"
              step="0.001"
              disabled={isReadOnly}
              value={draft.packageWeight || ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  packageWeight: Number(event.target.value),
                  packageWeightUnitCode: current.packageWeightUnitCode || weightUnit,
                }))
              }
            />
          </label>
          <label>
            Unit
            <select
              disabled={isReadOnly}
              value={draft.packageWeightUnitCode || weightUnit}
              onChange={(event) => setDraft((current) => ({ ...current, packageWeightUnitCode: event.target.value }))}
            >
              {options.weightUnits.map((unit) => (
                <option key={unit.code} value={unit.code}>{unit.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="listing-step__section">
        <h2>Return policy</h2>
        <YesNoGroup
          label="Return eligible?"
          value={draft.returnEligible}
          disabled={isReadOnly}
          onChange={(next) => setDraft((current) => ({ ...current, returnEligible: next }))}
        />
        {draft.returnEligible ? (
          <div className="listing-form-grid listing-form-grid--single">
            <label>
              Return window
              <select
                disabled={isReadOnly}
                value={draft.returnWindowCode}
                onChange={(event) => setDraft((current) => ({ ...current, returnWindowCode: event.target.value }))}
              >
                <option value="">Select return window</option>
                {options.returnWindows.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
            <fieldset className="listing-check-group">
              <legend>Return reason type</legend>
              {options.returnReasonTypes.map((item) => (
                <label key={item.code}>
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={draft.returnReasonCodes.includes(item.code)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        returnReasonCodes: event.target.checked
                          ? [...current.returnReasonCodes, item.code]
                          : current.returnReasonCodes.filter((code) => code !== item.code),
                      }))
                    }
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}
      </div>

      <ProductListingWizardNav
        onBack={onBack}
        onNext={() => {
          const validationError = validateStep4(draft)
          if (validationError) {
            window.alert(validationError)
            return
          }
          onNext()
        }}
        saving={saving}
        nextDisabled={isReadOnly}
      />
    </section>
  )
}
