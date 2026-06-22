import type { ReactNode } from 'react'
import { KYC_WIZARD_STEP_LABELS } from '../../lib/sellerKycWizard'

type KycWizardShellProps = {
  currentStep: number
  children: ReactNode
}

export function KycWizardShell({ currentStep, children }: KycWizardShellProps) {
  return (
    <section className="kyc-wizard">
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
