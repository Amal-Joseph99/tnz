import { Link } from 'react-router-dom'
import type { SellerKycDraft } from '../../lib/sellerKycWizard'

function RequiredMark() {
  return <span className="kyc-form-required" aria-hidden="true"> *</span>
}

type KycStep4BankProps = {
  draft: SellerKycDraft
  disabled: boolean
  saving: boolean
  rejectionReason?: string | null
  onChange: (patch: Partial<SellerKycDraft>) => void
  onSubmit: () => void
}

export function KycStep4Bank({
  draft,
  disabled,
  saving,
  rejectionReason,
  onChange,
  onSubmit,
}: KycStep4BankProps) {
  return (
    <>
      <section className="seller-console-card">
        <div className="seller-console-card__header">
          <div>
            <h2>Bank details</h2>
            <p>Used for seller payouts after order settlement.</p>
          </div>
        </div>
        <form className="checkout-form checkout-form--grid kyc-address-form">
          <label>
            Account holder name<RequiredMark />
            <input
              value={draft.accountHolderName}
              disabled={disabled}
              onChange={(event) => onChange({ accountHolderName: event.target.value })}
              required
            />
          </label>
          <label>
            Bank name<RequiredMark />
            <input
              value={draft.bankName}
              disabled={disabled}
              onChange={(event) => onChange({ bankName: event.target.value })}
              required
            />
          </label>
          <label>
            Account number<RequiredMark />
            <input
              value={draft.accountNumber}
              disabled={disabled}
              onChange={(event) => onChange({ accountNumber: event.target.value })}
              required
            />
          </label>
          <label>
            IFSC / SWIFT code<RequiredMark />
            <input
              value={draft.ifscSwift}
              disabled={disabled}
              onChange={(event) => onChange({ ifscSwift: event.target.value })}
              required
            />
          </label>
        </form>
      </section>

      {!disabled && (
        <section className="seller-console-card seller-kyc-terms">
          <div className="seller-kyc-terms__list">
            <label className="seller-terms-check">
              <input
                type="checkbox"
                checked={draft.termsAndPoliciesAccepted}
                onChange={(event) => onChange({ termsAndPoliciesAccepted: event.target.checked })}
              />
              <span>
                I accept the AGTRENZ <Link to="/seller/terms-policies">Terms &amp; Policies</Link>.
              </span>
            </label>
            <label className="seller-terms-check">
              <input
                type="checkbox"
                checked={draft.sellerAgreementAccepted}
                onChange={(event) => onChange({ sellerAgreementAccepted: event.target.checked })}
              />
              <span>
                I accept the AGTRENZ <Link to="/seller/terms-policies">Seller Agreement</Link>.
              </span>
            </label>
            <label className="seller-terms-check">
              <input
                type="checkbox"
                checked={draft.taxPayoutRulesAccepted}
                onChange={(event) => onChange({ taxPayoutRulesAccepted: event.target.checked })}
              />
              <span>
                I accept the AGTRENZ <Link to="/seller/terms-policies">Tax &amp; Payout Rules</Link>.
              </span>
            </label>
          </div>
          <button
            type="button"
            className="seller-primary-action seller-kyc-terms__submit"
            disabled={saving}
            onClick={onSubmit}
          >
            {saving ? 'Submitting...' : 'Submit for approval'}
          </button>
        </section>
      )}

      {rejectionReason ? (
        <section className="seller-console-card">
          <div className="auth-message auth-message--error">
            KYC rejected: {rejectionReason}. Update your details and resubmit.
          </div>
        </section>
      ) : null}
    </>
  )
}
