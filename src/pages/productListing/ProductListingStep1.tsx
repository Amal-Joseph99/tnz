import { useMemo } from 'react'
import { BulletPointEditor } from '../../components/productListing/BulletPointEditor'
import { SpecificationsEditor } from '../../components/productListing/SpecificationsEditor'
import { ProductListingWizardNav } from '../../components/productListing/ProductListingWizardShell'
import { useProductListingDraft } from '../../context/ProductListingDraftContext'
import { getHsnFromTree, type CategoryTree } from '../../lib/catalogCategories'
import { sortCategoryNames } from '../../lib/categoryDisplay'
import {
  BRAND_NAME_MAX,
  PRODUCT_NAME_MAX,
  SHORT_DESCRIPTION_MAX,
  validateStep1,
} from '../../lib/productListingWizard'

type Step1Props = {
  categoryTree: CategoryTree
  onBack: () => void
  onNext: () => void
}

export function ProductListingStep1({ categoryTree, onBack, onNext }: Step1Props) {
  const { draft, options, setDraft, isReadOnly, saving } = useProductListingDraft()

  const categoryNames = useMemo(() => sortCategoryNames(Object.keys(categoryTree)), [categoryTree])
  const subCategories = useMemo(
    () => (draft.categoryName ? Object.keys(categoryTree[draft.categoryName] ?? {}) : []),
    [categoryTree, draft.categoryName],
  )
  const productTypes = useMemo(
    () =>
      draft.categoryName && draft.subCategoryName
        ? categoryTree[draft.categoryName]?.[draft.subCategoryName]?.productTypes ?? []
        : [],
    [categoryTree, draft.categoryName, draft.subCategoryName],
  )

  const itemConditionLabel =
    options.itemConditions.find((item) => item.code === draft.itemConditionCode)?.label ?? 'Brand New'

  const hsnCode = draft.hsnCode || getHsnFromTree(categoryTree, draft.categoryName, draft.subCategoryName, draft.productTypeName)

  return (
    <section className="seller-console-card listing-step">
      <div className="listing-step__section">
        <h2>Section 1: Product classification</h2>
        <div className="listing-form-grid">
          <label>
            Category *
            <select
              disabled={isReadOnly}
              value={draft.categoryName}
              onChange={(event) => {
                const nextCategory = event.target.value
                const nextSub = Object.keys(categoryTree[nextCategory] ?? {})[0] ?? ''
                const nextType = categoryTree[nextCategory]?.[nextSub]?.productTypes[0] ?? ''
                const nextHsn = getHsnFromTree(categoryTree, nextCategory, nextSub, nextType)
                setDraft((current) => ({
                  ...current,
                  categoryName: nextCategory,
                  subCategoryName: nextSub,
                  productTypeName: nextType,
                  hsnCode: nextHsn,
                }))
              }}
            >
              <option value="">Select category</option>
              {categoryNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Sub category *
            <select
              disabled={isReadOnly}
              value={draft.subCategoryName}
              onChange={(event) => {
                const nextSub = event.target.value
                const nextType = categoryTree[draft.categoryName]?.[nextSub]?.productTypes[0] ?? ''
                const nextHsn = getHsnFromTree(categoryTree, draft.categoryName, nextSub, nextType)
                setDraft((current) => ({
                  ...current,
                  subCategoryName: nextSub,
                  productTypeName: nextType,
                  hsnCode: nextHsn,
                }))
              }}
            >
              <option value="">Select sub category</option>
              {subCategories.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Product type *
            <select
              disabled={isReadOnly}
              value={draft.productTypeName}
              onChange={(event) => {
                const nextType = event.target.value
                const nextHsn = getHsnFromTree(categoryTree, draft.categoryName, draft.subCategoryName, nextType)
                setDraft((current) => ({ ...current, productTypeName: nextType, hsnCode: nextHsn }))
              }}
            >
              <option value="">Select product type</option>
              {productTypes.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            HSN code
            <input value={hsnCode} readOnly aria-readonly="true" />
          </label>
          <label>
            Item condition
            <input value={itemConditionLabel} readOnly aria-readonly="true" />
          </label>
        </div>
      </div>

      <div className="listing-step__section">
        <h2>Section 2: Product details</h2>
        <div className="listing-form-grid">
          <label>
            Product name *
            <input
              maxLength={PRODUCT_NAME_MAX}
              disabled={isReadOnly}
              value={draft.productName}
              onChange={(event) => setDraft((current) => ({ ...current, productName: event.target.value }))}
            />
            <span className="listing-field-hint">{draft.productName.length}/{PRODUCT_NAME_MAX}</span>
          </label>
          <label>
            Brand name *
            <input
              maxLength={BRAND_NAME_MAX}
              disabled={isReadOnly}
              value={draft.brandName}
              onChange={(event) => setDraft((current) => ({ ...current, brandName: event.target.value }))}
            />
            <span className="listing-field-hint">{draft.brandName.length}/{BRAND_NAME_MAX}</span>
          </label>
          <label className="listing-form-grid__full">
            Short description *
            <textarea
              maxLength={SHORT_DESCRIPTION_MAX}
              disabled={isReadOnly}
              value={draft.shortDescription}
              onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))}
            />
            <span className="listing-field-hint">{draft.shortDescription.length}/{SHORT_DESCRIPTION_MAX}</span>
          </label>
          <div className="listing-form-grid__full">
            <BulletPointEditor
              label="Full description"
              required
              disabled={isReadOnly}
              value={draft.fullDescriptionBullets}
              onChange={(bullets) => setDraft((current) => ({ ...current, fullDescriptionBullets: bullets }))}
            />
          </div>
        </div>
      </div>

      <SpecificationsEditor
        disabled={isReadOnly}
        rows={draft.specifications.map((row) => ({
          attributeName: row.attributeName,
          attributeValue: row.attributeValue,
        }))}
        onChange={(rows) =>
          setDraft((current) => ({
            ...current,
            specifications: rows.map((row, index) => ({
              attributeName: row.attributeName,
              attributeValue: row.attributeValue,
              sortOrder: index,
            })),
          }))
        }
      />

      <ProductListingWizardNav
        onBack={onBack}
        onNext={() => {
          const validationError = validateStep1({ ...draft, hsnCode })
          if (validationError) {
            window.alert(validationError)
            return
          }
          onNext()
        }}
        nextLabel="Next"
        saving={saving}
        nextDisabled={isReadOnly}
      />
    </section>
  )
}
