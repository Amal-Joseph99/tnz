import type { SellerKycDraft } from '../../lib/sellerKycWizard'

function RequiredMark() {
  return <span className="kyc-form-required" aria-hidden="true"> *</span>
}

type KycStep2BusinessProps = {
  draft: SellerKycDraft
  countryOptions: string[]
  disabled: boolean
  onChange: (patch: Partial<SellerKycDraft>) => void
}

export function KycStep2Business({ draft, countryOptions, disabled, onChange }: KycStep2BusinessProps) {
  return (
    <section className="seller-console-card kyc-address-card">
      <div className="seller-console-card__header">
        <div>
          <h2>Business details</h2>
          <p>Tax ID is optional for individual sellers.</p>
        </div>
      </div>
      <form className="checkout-form checkout-form--grid kyc-address-form">
        <label>
          Business name<RequiredMark />
          <input
            value={draft.businessName}
            disabled={disabled}
            onChange={(event) => onChange({ businessName: event.target.value })}
            required
          />
        </label>
        <label>
          Type of business<RequiredMark />
          <select
            value={draft.businessType}
            disabled={disabled}
            onChange={(event) => onChange({ businessType: event.target.value })}
          >
            <option>Individual</option>
            <option>Proprietorship</option>
            <option>Partnership</option>
            <option>Private Limited</option>
            <option>LLP</option>
          </select>
        </label>
        <label className="checkout-form__full kyc-same-address-check">
          <input
            type="checkbox"
            checked={draft.businessSameAsIndividual}
            disabled={disabled}
            onChange={(event) => onChange({ businessSameAsIndividual: event.target.checked })}
          />
          <span>Business address is the same as permanent address</span>
        </label>
        <div className="checkout-form__full kyc-address-subsection">
          <h3>Business address</h3>
        </div>
        <label className="checkout-form__full">
          Street address<RequiredMark />
          <input
            value={draft.businessStreetAddress}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessStreetAddress: event.target.value })}
            required
          />
        </label>
        <label className="checkout-form__full">
          Apartment, suite, etc. (optional)
          <input
            value={draft.businessAddressLine2}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessAddressLine2: event.target.value })}
          />
        </label>
        <label>
          City<RequiredMark />
          <input
            value={draft.businessCity}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessCity: event.target.value })}
            required
          />
        </label>
        <label>
          State / Province<RequiredMark />
          <input
            value={draft.businessStateProvince}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessStateProvince: event.target.value })}
            required
          />
        </label>
        <label>
          Postal code<RequiredMark />
          <input
            value={draft.businessPostalCode}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessPostalCode: event.target.value })}
            required
          />
        </label>
        <label>
          Country<RequiredMark />
          <select
            value={draft.businessAddressCountry}
            disabled={disabled || draft.businessSameAsIndividual}
            onChange={(event) => onChange({ businessAddressCountry: event.target.value })}
            required
          >
            <option value="">Select country</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="checkout-form__full">
          Tax ID number (optional)
          <input
            value={draft.taxId}
            disabled={disabled}
            onChange={(event) => onChange({ taxId: event.target.value })}
            placeholder="Enter tax ID if applicable"
          />
        </label>
      </form>
    </section>
  )
}
