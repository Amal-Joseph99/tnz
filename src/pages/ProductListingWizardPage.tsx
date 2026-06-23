import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { ProductListingWizardShell } from '../components/productListing/ProductListingWizardShell'
import { ProductListingDraftProvider } from '../context/ProductListingDraftContext'
import { buildCategoryTree, fetchCategoryTaxonomy } from '../lib/catalogCategories'
import { fetchSellerAccountProfile } from '../lib/sellerKyc'
import { fetchSellerCountryOptions } from '../lib/sellerCountries'
import {
  createEmptyProductListingDraft,
  fetchProductListingWizardOptions,
  loadProductListingDraft,
  saveProductListingDraft,
  submitProductListingForApproval,
  shouldGenerateProductSku,
  type ProductListingDraft,
  type ProductListingWizardOptions,
} from '../lib/productListingWizard'
import { fetchSellerWorkflow, type SellerWorkflowState } from '../lib/sellerWorkflow'
import { ProductListingStep1 } from './productListing/ProductListingStep1'
import { ProductListingStep2 } from './productListing/ProductListingStep2'
import { ProductListingStep3 } from './productListing/ProductListingStep3'
import { ProductListingStep4 } from './productListing/ProductListingStep4'
import { ProductListingStep5 } from './productListing/ProductListingStep5'

const TOTAL_STEPS = 5

function parseStep(value: string | undefined) {
  const step = Number.parseInt(value ?? '1', 10)
  if (!Number.isFinite(step) || step < 1 || step > TOTAL_STEPS) return 1
  return step
}

export function ProductListingWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { productId: productIdParam, step: stepParam } = useParams()
  const isNewListingRoute = location.pathname.startsWith('/seller/products/new/')
  const editingProductId =
    productIdParam && productIdParam !== 'new' ? Number(productIdParam) : null
  const currentStep = parseStep(stepParam)

  const [workflow, setWorkflow] = useState<SellerWorkflowState | null>(null)
  const [options, setOptions] = useState<ProductListingWizardOptions | null>(null)
  const [categoryTree, setCategoryTree] = useState<ReturnType<typeof buildCategoryTree>>({})
  const [countryOptions, setCountryOptions] = useState<Awaited<ReturnType<typeof fetchSellerCountryOptions>>>([])
  const [draft, setDraft] = useState<ProductListingDraft>(createEmptyProductListingDraft())
  const [productId, setProductId] = useState<number | null>(editingProductId)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaveMessage, setAutoSaveMessage] = useState('')
  const [error, setError] = useState('')
  const autoSaveTimer = useRef<number | null>(null)

  const isReadOnly = draft.approvalStatus === 'pending'

  const goToStep = useCallback(
    (step: number, id = productId) => {
      const prefix = id ? `/seller/products/${id}/edit` : '/seller/products/new'
      navigate(`${prefix}/step/${step}`)
    },
    [navigate, productId],
  )

  const persistDraft = useCallback(
    async (nextDraft: ProductListingDraft, step: number, generateSku = false) => {
      setSaving(true)
      setError('')
      const result = await saveProductListingDraft(nextDraft, productId, step, { generateSku })
      setSaving(false)

      if (!result.ok) {
        setError(result.message)
        return null
      }

      const savedProductId = result.productId ?? productId
      if (!productId && savedProductId) {
        setProductId(savedProductId)
        navigate(`/seller/products/${savedProductId}/edit/step/${step}`, { replace: true })
      }

      setDraft((current) => ({ ...current, sku: result.sku || current.sku, listingStep: step }))
      setAutoSaveMessage(`Draft saved at ${new Date().toLocaleTimeString()}`)
      return savedProductId
    },
    [navigate, productId],
  )

  const scheduleAutoSave = useCallback(
    (nextDraft: ProductListingDraft, step: number) => {
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = window.setTimeout(() => {
        void persistDraft(nextDraft, step)
      }, 1200)
    },
    [persistDraft],
  )

  const setDraftWithAutoSave = useCallback(
    (updater: (current: ProductListingDraft) => ProductListingDraft) => {
      setDraft((current) => {
        const next = updater(current)
        scheduleAutoSave(next, currentStep)
        return next
      })
    },
    [currentStep, scheduleAutoSave],
  )

  useEffect(() => {
    let active = true

    Promise.all([
      fetchSellerWorkflow(),
      fetchProductListingWizardOptions(),
      fetchCategoryTaxonomy(),
      fetchSellerAccountProfile(),
      fetchSellerCountryOptions().catch(() => []),
      editingProductId ? loadProductListingDraft(editingProductId) : Promise.resolve(null),
    ])
      .then(([workflowState, wizardOptions, taxonomyRows, accountProfile, countries, existingDraft]) => {
        if (!active) return

        setWorkflow(workflowState)
        setOptions(wizardOptions)
        setCategoryTree(buildCategoryTree(taxonomyRows))
        setCountryOptions(countries)

        const originCountry = accountProfile?.countryName ?? ''
        const defaultCondition = wizardOptions.itemConditions[0]?.code ?? ''
        const lengthUnit = wizardOptions.dimensionUnits[0]?.code ?? ''
        const weightUnit = wizardOptions.weightUnits[0]?.code ?? ''

        if (existingDraft) {
          setDraft({
            ...existingDraft,
            itemConditionCode: existingDraft.itemConditionCode || defaultCondition,
            packageLengthUnitCode: existingDraft.packageLengthUnitCode || lengthUnit,
            packageWidthUnitCode: existingDraft.packageWidthUnitCode || lengthUnit,
            packageHeightUnitCode: existingDraft.packageHeightUnitCode || lengthUnit,
            packageWeightUnitCode: existingDraft.packageWeightUnitCode || weightUnit,
          })
          setProductId(editingProductId)
        } else {
          setDraft({
            ...createEmptyProductListingDraft(originCountry),
            itemConditionCode: defaultCondition,
            manufacturerCountry: originCountry,
            originCountry,
            packageLengthUnitCode: lengthUnit,
            packageWidthUnitCode: lengthUnit,
            packageHeightUnitCode: lengthUnit,
            packageWeightUnitCode: weightUnit,
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      if (autoSaveTimer.current) window.clearTimeout(autoSaveTimer.current)
    }
  }, [editingProductId])

  const providerValue = useMemo(
    () => ({
      draft,
      options: options ?? {
        itemConditions: [],
        warrantyPeriods: [],
        dimensionUnits: [],
        weightUnits: [],
        returnWindows: [],
        returnReasonTypes: [],
        sizePresets: [],
        colorPresets: [],
      },
      productId,
      isReadOnly,
      saving,
      autoSaveMessage,
      error,
      setDraft: setDraftWithAutoSave,
      saveDraft: async (step: number, opts?: { generateSku?: boolean }) => {
        const savedId = await persistDraft(draft, step, opts?.generateSku)
        return Boolean(savedId)
      },
      reloadDraft: async () => {
        if (!productId) return
        const next = await loadProductListingDraft(productId)
        if (next) setDraft(next)
      },
    }),
    [autoSaveMessage, draft, error, isReadOnly, options, persistDraft, productId, saving, setDraftWithAutoSave],
  )

  if (!isNewListingRoute && (!editingProductId || Number.isNaN(editingProductId))) {
    return <Navigate to="/seller/products" replace />
  }

  if (loading || !workflow || !options) {
    return (
      <SellerDashboardShell title={editingProductId ? 'Edit product' : 'Add product'} hidePageHeading>
        <p>Loading...</p>
      </SellerDashboardShell>
    )
  }

  if (!workflow.warehouseCompleted) {
    return <Navigate to="/seller/products" replace />
  }

  const handleNextFromStep1 = async () => {
    const savedId = await persistDraft(draft, 1, shouldGenerateProductSku(draft.sku))
    if (savedId) goToStep(2, savedId)
  }

  const handleNext = async (step: number) => {
    const savedId = await persistDraft(draft, step)
    if (savedId) goToStep(step + 1, savedId)
  }

  const handleSubmit = async () => {
    if (!productId) {
      setError('Save the draft before submitting.')
      return
    }

    setSaving(true)
    const savedId = await persistDraft(draft, 5, shouldGenerateProductSku(draft.sku))
    if (!savedId) {
      setSaving(false)
      return
    }

    const result = await submitProductListingForApproval(productId, draft)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate('/seller/products?status=draft&page=1')
  }

  return (
    <SellerDashboardShell
      title={editingProductId ? 'Edit product' : 'Add product'}
      hidePageHeading
    >
      <ProductListingDraftProvider value={providerValue}>
        <ProductListingWizardShell
          currentStep={currentStep}
          sku={draft.sku}
          mode={editingProductId ? 'edit' : 'create'}
        >
          {error && <div className="auth-message auth-message--error">{error}</div>}
          {autoSaveMessage && <div className="auth-message auth-message--success">{autoSaveMessage}</div>}

          {currentStep === 1 && (
            <ProductListingStep1
              categoryTree={categoryTree}
              onBack={() => navigate('/seller/products')}
              onNext={() => void handleNextFromStep1()}
            />
          )}
          {currentStep === 2 && (
            <ProductListingStep2
              countryOptions={countryOptions}
              onBack={() => goToStep(1)}
              onNext={() => void handleNext(2)}
            />
          )}
          {currentStep === 3 && (
            <ProductListingStep3
              productId={productId}
              onBack={() => goToStep(2)}
              onNext={() => void handleNext(3)}
            />
          )}
          {currentStep === 4 && (
            <ProductListingStep4 onBack={() => goToStep(3)} onNext={() => void handleNext(4)} />
          )}
          {currentStep === 5 && (
            <ProductListingStep5 onBack={() => goToStep(4)} onSubmit={() => void handleSubmit()} />
          )}
        </ProductListingWizardShell>
      </ProductListingDraftProvider>
    </SellerDashboardShell>
  )
}

export function ProductListingWizardRedirect() {
  const { productId } = useParams()
  if (productId === 'new') {
    return <Navigate to="/seller/products/new/step/1" replace />
  }
  return <Navigate to={`/seller/products/${productId}/edit/step/1`} replace />
}
