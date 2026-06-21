import type { ReactNode } from 'react'
import { KYC_WIZARD_STEP_LABELS } from '../../lib/sellerKycWizard'

type KycWizardShellProps = {
  currentStep: number
  kycId?: string
  children: ReactNode
  statusAside?: ReactNode
}

export function KycWizardShell({ currentStep, kycId, children, statusAside }: KycWizardShellProps) {
  return (
    <section className="seller-console-grid seller-console-grid--kyc">
      <div className="seller-kyc-main">
        <ol className="kyc-wizard__steps" aria-label="KYC verification steps">
          {KYC_WIZARD_STEP_LABELS.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === currentStep
            const isComplete = stepNumber < currentStep
            return (
              <li
                key={label}
                className={`kyc-wizard__step${isActive ? ' kyc-wizard__step--active' : ''}${isComplete ? ' kyc-wizard__step--complete' : ''}`}
              >
                <span>{stepNumber}</span>
                <strong>{label}</strong>
              </li>
            )
          })}
        </ol>
        <div className="kyc-wizard__content">{children}</div>
      </div>
      {statusAside ? <aside className="seller-kyc-status">{statusAside}</aside> : null}
      {kycId ? <span className="kyc-wizard__id">KYC ID: {kycId}</span> : null}
    </section>
  )
}

type KycWizardNavProps = {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
  saving?: boolean
}

export function KycWizardNav({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  nextDisabled = false,
  saving = false,
}: KycWizardNavProps) {
  return (
    <div className="kyc-wizard__nav">
      {onBack ? (
        <button type="button" className="seller-secondary-action" onClick={onBack} disabled={saving}>
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext ? (
        <button type="button" className="seller-primary-action" disabled={nextDisabled || saving} onClick={onNext}>
          {saving ? 'Saving...' : nextLabel}
        </button>
      ) : null}
    </div>
  )
}
