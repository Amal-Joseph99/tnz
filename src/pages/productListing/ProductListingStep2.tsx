import { BulletPointEditor } from '../../components/productListing/BulletPointEditor'
import { ProductListingWizardNav } from '../../components/productListing/ProductListingWizardShell'
import { useProductListingDraft } from '../../context/ProductListingDraftContext'
import {
  MANUFACTURER_NAME_MAX,
  PACKAGE_CONTENTS_MAX_BULLETS,
  TEXT_AREA_MAX,
  validateStep2,
} from '../../lib/productListingWizard'

type Step2Props = {
  countryOptions: Array<{ id: number; country_name: string }>
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
        <input type="radio" name={label} checked={value} disabled={disabled} onChange={() => onChange(true)} />
        Yes
      </label>
      <label>
        <input type="radio" name={label} checked={!value} disabled={disabled} onChange={() => onChange(false)} />
        No
      </label>
    </fieldset>
  )
}

export function ProductListingStep2({ countryOptions, onBack, onNext }: Step2Props) {
  const { draft, options, setDraft, isReadOnly, saving } = useProductListingDraft()

  return (
    <section className="seller-console-card listing-step">
      <div className="listing-step__section">
        <h2>Manufacturer information</h2>
        <div className="listing-form-grid">
          <label>
            Manufacturer name *
            <input
              maxLength={MANUFACTURER_NAME_MAX}
              disabled={isReadOnly}
              value={draft.manufacturerName}
              onChange={(event) => setDraft((current) => ({ ...current, manufacturerName: event.target.value }))}
            />
          </label>
          <label>
            Manufacturer country *
            <select
              disabled={isReadOnly}
              value={draft.manufacturerCountry}
              onChange={(event) => setDraft((current) => ({ ...current, manufacturerCountry: event.target.value }))}
            >
              <option value="">Select country</option>
              {countryOptions.map((country) => (
                <option key={country.id} value={country.country_name}>{country.country_name}</option>
              ))}
            </select>
          </label>
          <label>
            Product origin country
            <input value={draft.originCountry} readOnly aria-readonly="true" />
          </label>
        </div>
      </div>

      <div className="listing-step__section">
        <h2>Ingredients & instructions</h2>
        <div className="listing-form-grid listing-form-grid--single">
          <label>
            Ingredients
            <textarea
              maxLength={TEXT_AREA_MAX}
              disabled={isReadOnly}
              value={draft.ingredients}
              onChange={(event) => setDraft((current) => ({ ...current, ingredients: event.target.value }))}
            />
          </label>
          <label>
            Usage instructions
            <textarea
              maxLength={TEXT_AREA_MAX}
              disabled={isReadOnly}
              value={draft.usageInstructions}
              onChange={(event) => setDraft((current) => ({ ...current, usageInstructions: event.target.value }))}
            />
          </label>
          <label>
            Important note / warning
            <textarea
              maxLength={TEXT_AREA_MAX}
              disabled={isReadOnly}
              value={draft.importantNote}
              onChange={(event) => setDraft((current) => ({ ...current, importantNote: event.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className="listing-step__section">
        <h2>Warranty information</h2>
        <YesNoGroup
          label="Warranty available?"
          value={draft.warrantyAvailable}
          disabled={isReadOnly}
          onChange={(next) => setDraft((current) => ({ ...current, warrantyAvailable: next }))}
        />
        {draft.warrantyAvailable ? (
          <div className="listing-form-grid">
            <label>
              Warranty period *
              <select
                disabled={isReadOnly}
                value={draft.warrantyPeriodCode}
                onChange={(event) => setDraft((current) => ({ ...current, warrantyPeriodCode: event.target.value }))}
              >
                <option value="">Select period</option>
                {options.warrantyPeriods.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Warranty type *
              <input
                disabled={isReadOnly}
                value={draft.warrantyType}
                onChange={(event) => setDraft((current) => ({ ...current, warrantyType: event.target.value }))}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="listing-step__section">
        <h2>Dangerous goods declaration</h2>
        <div className="listing-yes-no-grid">
          <YesNoGroup label="Contains battery?" value={draft.containsBattery} disabled={isReadOnly} onChange={(next) => setDraft((c) => ({ ...c, containsBattery: next }))} />
          <YesNoGroup label="Contains liquid?" value={draft.containsLiquid} disabled={isReadOnly} onChange={(next) => setDraft((c) => ({ ...c, containsLiquid: next }))} />
          <YesNoGroup label="Contains magnetic material?" value={draft.containsMagneticMaterial} disabled={isReadOnly} onChange={(next) => setDraft((c) => ({ ...c, containsMagneticMaterial: next }))} />
          <YesNoGroup label="Contains aerosol?" value={draft.containsAerosol} disabled={isReadOnly} onChange={(next) => setDraft((c) => ({ ...c, containsAerosol: next }))} />
          <YesNoGroup label="Contains flammable material?" value={draft.containsFlammableMaterial} disabled={isReadOnly} onChange={(next) => setDraft((c) => ({ ...c, containsFlammableMaterial: next }))} />
        </div>
      </div>

      <div className="listing-step__section">
        <BulletPointEditor
          label="Package contents"
          disabled={isReadOnly}
          maxBullets={PACKAGE_CONTENTS_MAX_BULLETS}
          maxTotalChars={1500}
          value={draft.packageContentsBullets}
          onChange={(bullets) => setDraft((current) => ({ ...current, packageContentsBullets: bullets }))}
        />
      </div>

      <ProductListingWizardNav
        onBack={onBack}
        onNext={() => {
          const validationError = validateStep2(draft)
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
