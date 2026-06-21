import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_LISTING_STEP_LABELS } from '../../lib/productListingWizard'

type ProductListingWizardShellProps = {
  currentStep: number
  sku?: string
  children: ReactNode
}

export function ProductListingWizardShell({ currentStep, sku, children }: ProductListingWizardShellProps) {
  return (
    <div className="product-listing-wizard">
      <div className="product-listing-wizard__top">
        <Link to="/seller/products" className="seller-secondary-action seller-inline-link-button">
          ← Back to products
        </Link>
        {sku ? <span className="product-listing-wizard__sku">SKU: {sku}</span> : null}
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
    </div>
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
        <button type="button" className="seller-secondary-action" onClick={onBack}>
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
