import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_LISTING_STEP_LABELS } from '../../lib/productListingWizard'

const TOTAL_STEPS = PRODUCT_LISTING_STEP_LABELS.length

type ProductListingWizardShellProps = {
  currentStep: number
  sku?: string
  mode?: 'create' | 'edit'
  children: ReactNode
}

export function ProductListingWizardShell({
  currentStep,
  sku,
  mode = 'create',
  children,
}: ProductListingWizardShellProps) {
  const stepLabel = PRODUCT_LISTING_STEP_LABELS[currentStep - 1] ?? `Step ${currentStep}`
  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100)

  return (
    <section className="admin-panel product-listing-wizard">
      <div className="product-listing-wizard__header">
        <Link to="/seller/products" className="admin-btn admin-btn--ghost product-listing-wizard__back">
          ← Products
        </Link>
        {sku ? <span className="product-listing-wizard__sku">SKU: {sku}</span> : null}
      </div>

      <div className="product-listing-wizard__mobile-progress" aria-label={`Step ${currentStep} of ${TOTAL_STEPS}: ${stepLabel}`}>
        <div className="product-listing-wizard__mobile-copy">
          <span>{mode === 'edit' ? 'Edit product' : 'Add product'} · Step {currentStep} of {TOTAL_STEPS}</span>
          <strong>{stepLabel}</strong>
        </div>
        <div className="product-listing-wizard__progress-track" aria-hidden="true">
          <div className="product-listing-wizard__progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <ol className="product-listing-wizard__steps" aria-label="Product listing steps">
        {PRODUCT_LISTING_STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isComplete = stepNumber < currentStep
          return (
            <li
              key={label}
              className={`product-listing-wizard__step${isActive ? ' product-listing-wizard__step--active' : ''}${isComplete ? ' product-listing-wizard__step--complete' : ''}`}
            >
              <span>{stepNumber}</span>
              <strong>{label}</strong>
            </li>
          )
        })}
      </ol>

      <div className="product-listing-wizard__content">{children}</div>
    </section>
  )
}

type WizardNavProps = {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
  saving?: boolean
}

export function ProductListingWizardNav({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  nextDisabled = false,
  saving = false,
}: WizardNavProps) {
  return (
    <div className="product-listing-wizard__nav">
      {onBack ? (
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onBack}>
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext ? (
        <button type="button" className="admin-btn" disabled={nextDisabled || saving} onClick={onNext}>
          {saving ? 'Saving...' : nextLabel}
        </button>
      ) : null}
    </div>
  )
}
