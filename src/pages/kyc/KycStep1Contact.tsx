import { LocationIcon } from '../../components/Icons'
import type { SellerKycDraft } from '../../lib/sellerKycWizard'

function RequiredMark() {
  return <span className="kyc-form-required" aria-hidden="true"> *</span>
}

type KycStep1ContactProps = {
  draft: SellerKycDraft
  countryOptions: string[]
  disabled: boolean
  locating: boolean
  onChange: (patch: Partial<SellerKycDraft>) => void
  onUseCurrentLocation: () => void
}

export function KycStep1Contact({
  draft,
  countryOptions,
  disabled,
  locating,
  onChange,
  onUseCurrentLocation,
}: KycStep1ContactProps) {
  return (
    <section className="seller-console-card kyc-address-card">
      <div className="seller-console-card__header">
        <div>
          <h2>Contact details</h2>
          <p>Primary contact and permanent personal address.</p>
        </div>
      </div>
      <form className="checkout-form checkout-form--grid kyc-address-form">
        <label>
          Full name<RequiredMark />
          <input
            value={draft.contactFullName}
            disabled={disabled}
            onChange={(event) => onChange({ contactFullName: event.target.value })}
            required
          />
        </label>
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
          Email
          <input value={draft.email} disabled readOnly />
        </label>
        <label>
          Mobile number<RequiredMark />
          <input
            value={draft.contactPhone}
            disabled={disabled}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
            required
          />
        </label>
        <div className="checkout-form__full kyc-address-subsection">
          <h3>Permanent address (personal)</h3>
        </div>
        <label className="checkout-form__full">
          Street address<RequiredMark />
          <input
            value={draft.streetAddress}
            disabled={disabled}
            onChange={(event) => onChange({ streetAddress: event.target.value })}
            required
          />
        </label>
        <label className="checkout-form__full">
          Apartment, suite, etc. (optional)
          <input
            value={draft.addressLine2}
            disabled={disabled}
            onChange={(event) => onChange({ addressLine2: event.target.value })}
          />
        </label>
        <label>
          City<RequiredMark />
          <input
            value={draft.city}
            disabled={disabled}
            onChange={(event) => onChange({ city: event.target.value })}
            required
          />
        </label>
        <label>
          State / Province<RequiredMark />
          <input
            value={draft.stateProvince}
            disabled={disabled}
            onChange={(event) => onChange({ stateProvince: event.target.value })}
            required
          />
        </label>
        <label>
          Postal code<RequiredMark />
          <input
            value={draft.postalCode}
            disabled={disabled}
            onChange={(event) => onChange({ postalCode: event.target.value })}
            required
          />
        </label>
        <label>
          Country<RequiredMark />
          <select
            value={draft.addressCountry}
            disabled={disabled}
            onChange={(event) => onChange({ addressCountry: event.target.value })}
            required
          >
            <option value="">Select country</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        {!disabled && (
          <div className="checkout-form__full">
            <button
              type="button"
              className="kyc-location-btn"
              disabled={locating}
              onClick={onUseCurrentLocation}
            >
              <LocationIcon />
              {locating ? 'Detecting location...' : 'Use current location'}
            </button>
          </div>
        )}
      </form>
    </section>
  )
}
