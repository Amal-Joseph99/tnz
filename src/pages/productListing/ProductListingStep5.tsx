import { ProductListingWizardNav } from '../../components/productListing/ProductListingWizardShell'
import { useProductListingDraft } from '../../context/ProductListingDraftContext'
import { validateStep5 } from '../../lib/productListingWizard'

type Step5Props = {
  onBack: () => void
  onSubmit: () => void
}

export function ProductListingStep5({ onBack, onSubmit }: Step5Props) {
  const { draft, setDraft, isReadOnly, saving } = useProductListingDraft()

  return (
    <section className="seller-console-card listing-step">
      <div className="listing-step__section">
        <h2>Review & submit</h2>
        <div className="listing-review-grid">
          <div><strong>SKU</strong><span>{draft.sku || 'Generated on save'}</span></div>
          <div><strong>Product</strong><span>{draft.productName}</span></div>
          <div><strong>Brand</strong><span>{draft.brandName}</span></div>
          <div><strong>Category</strong><span>{draft.categoryName} / {draft.subCategoryName} / {draft.productTypeName}</span></div>
          <div><strong>HSN</strong><span>{draft.hsnCode}</span></div>
          <div><strong>Variants</strong><span>{draft.variants.length}</span></div>
          <div><strong>Images</strong><span>{draft.media.filter((item) => item.mediaType === 'product_image').length}</span></div>
          <div><strong>Return eligible</strong><span>{draft.returnEligible ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      <div className="listing-step__section">
        <h2>Seller declaration</h2>
        <div className="listing-declaration-list">
          <label>
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={draft.declarationAccurate}
              onChange={(event) => setDraft((current) => ({ ...current, declarationAccurate: event.target.checked }))}
            />
            I confirm that all information provided is accurate.
          </label>
          <label>
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={draft.declarationPolicy}
              onChange={(event) => setDraft((current) => ({ ...current, declarationPolicy: event.target.checked }))}
            />
            I confirm that this product does not violate AGTRENZ policies.
          </label>
          <label>
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={draft.declarationLegalRight}
              onChange={(event) => setDraft((current) => ({ ...current, declarationLegalRight: event.target.checked }))}
            />
            I confirm that I have the legal right to sell this product.
          </label>
          <label>
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={draft.declarationTerms}
              onChange={(event) => setDraft((current) => ({ ...current, declarationTerms: event.target.checked }))}
            />
            I agree to AGTRENZ Seller Terms & Conditions.
          </label>
        </div>
      </div>

      <ProductListingWizardNav
        onBack={onBack}
        onNext={() => {
          const validationError = validateStep5(draft)
          if (validationError) {
            window.alert(validationError)
            return
          }
          onSubmit()
        }}
        nextLabel="Submit for approval"
        saving={saving}
        nextDisabled={isReadOnly}
      />
    </section>
  )
}
