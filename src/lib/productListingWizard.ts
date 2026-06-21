import { supabase } from './supabase'

export type WizardOption = {
  code: string
  label: string
  sortOrder: number
}

export type ProductListingWizardOptions = {
  itemConditions: WizardOption[]
  warrantyPeriods: WizardOption[]
  dimensionUnits: WizardOption[]
  weightUnits: WizardOption[]
  returnWindows: WizardOption[]
  returnReasonTypes: WizardOption[]
  sizePresets: WizardOption[]
  colorPresets: WizardOption[]
}

export type SpecificationDraft = {
  attributeName: string
  attributeValue: string
  sortOrder: number
}

export type VariantDraft = {
  id?: number
  variantId: string
  size: string
  color: string
  mrp: number
  sellingPrice: number
  stock: number
  imageStoragePath?: string
  imageFileName?: string
  sortOrder: number
}

export type MediaDraft = {
  id?: number
  mediaType: 'product_image' | 'product_video'
  storagePath: string
  fileName: string
  mimeType?: string
  slotIndex?: number
  sortOrder: number
  previewUrl?: string
}

export type ProductListingDraft = {
  sku: string
  approvalStatus: string
  listingStep: number
  categoryName: string
  subCategoryName: string
  productTypeName: string
  hsnCode: string
  itemConditionCode: string
  productName: string
  brandName: string
  shortDescription: string
  fullDescriptionBullets: string[]
  specifications: SpecificationDraft[]
  manufacturerName: string
  manufacturerCountry: string
  originCountry: string
  ingredients: string
  usageInstructions: string
  importantNote: string
  warrantyAvailable: boolean
  warrantyPeriodCode: string
  warrantyType: string
  containsBattery: boolean
  containsLiquid: boolean
  containsMagneticMaterial: boolean
  containsAerosol: boolean
  containsFlammableMaterial: boolean
  packageContentsBullets: string[]
  variants: VariantDraft[]
  media: MediaDraft[]
  packageLength: number
  packageWidth: number
  packageHeight: number
  packageLengthUnitCode: string
  packageWidthUnitCode: string
  packageHeightUnitCode: string
  packageWeight: number
  packageWeightUnitCode: string
  returnEligible: boolean
  returnWindowCode: string
  returnReasonCodes: string[]
  declarationAccurate: boolean
  declarationPolicy: boolean
  declarationLegalRight: boolean
  declarationTerms: boolean
}

export const PRODUCT_LISTING_STEP_LABELS = [
  'Product information',
  'Manufacturer & compliance',
  'Images & variants',
  'Package & returns',
  'Review & submit',
] as const

export const PRODUCT_NAME_MAX = 85
export const BRAND_NAME_MAX = 55
export const SHORT_DESCRIPTION_MAX = 400
export const FULL_DESCRIPTION_MAX = 1500
export const MANUFACTURER_NAME_MAX = 150
export const TEXT_AREA_MAX = 500
export const PACKAGE_CONTENTS_MAX_BULLETS = 20
export const MIN_PRODUCT_IMAGES = 3
export const MAX_PRODUCT_IMAGES = 10
export const MAX_PRODUCT_VIDEOS = 2

export function createEmptyProductListingDraft(originCountry = ''): ProductListingDraft {
  return {
    sku: '',
    approvalStatus: 'draft',
    listingStep: 1,
    categoryName: '',
    subCategoryName: '',
    productTypeName: '',
    hsnCode: '',
    itemConditionCode: '',
    productName: '',
    brandName: '',
    shortDescription: '',
    fullDescriptionBullets: [],
    specifications: [{ attributeName: '', attributeValue: '', sortOrder: 0 }],
    manufacturerName: '',
    manufacturerCountry: originCountry,
    originCountry,
    ingredients: '',
    usageInstructions: '',
    importantNote: '',
    warrantyAvailable: false,
    warrantyPeriodCode: '',
    warrantyType: '',
    containsBattery: false,
    containsLiquid: false,
    containsMagneticMaterial: false,
    containsAerosol: false,
    containsFlammableMaterial: false,
    packageContentsBullets: [],
    variants: [],
    media: [],
    packageLength: 0,
    packageWidth: 0,
    packageHeight: 0,
    packageLengthUnitCode: '',
    packageWidthUnitCode: '',
    packageHeightUnitCode: '',
    packageWeight: 0,
    packageWeightUnitCode: '',
    returnEligible: false,
    returnWindowCode: '',
    returnReasonCodes: [],
    declarationAccurate: false,
    declarationPolicy: false,
    declarationLegalRight: false,
    declarationTerms: false,
  }
}

function mapOptions(rows: unknown, key = 'code'): WizardOption[] {
  if (!Array.isArray(rows)) return []
  return rows.map((row) => {
    const item = row as Record<string, unknown>
    return {
      code: String(item[key] ?? item.code ?? ''),
      label: String(item.label ?? ''),
      sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    }
  })
}

export async function fetchProductListingWizardOptions(): Promise<ProductListingWizardOptions> {
  const empty: ProductListingWizardOptions = {
    itemConditions: [],
    warrantyPeriods: [],
    dimensionUnits: [],
    weightUnits: [],
    returnWindows: [],
    returnReasonTypes: [],
    sizePresets: [],
    colorPresets: [],
  }

  if (!supabase) return empty

  const { data, error } = await supabase.rpc('list_product_listing_wizard_options')
  if (error || !data || typeof data !== 'object') return empty

  const payload = data as Record<string, unknown>
  return {
    itemConditions: mapOptions(payload.itemConditions),
    warrantyPeriods: mapOptions(payload.warrantyPeriods),
    dimensionUnits: mapOptions(payload.dimensionUnits),
    weightUnits: mapOptions(payload.weightUnits),
    returnWindows: mapOptions(payload.returnWindows),
    returnReasonTypes: mapOptions(payload.returnReasonTypes),
    sizePresets: mapOptions(payload.sizePresets),
    colorPresets: mapOptions(payload.colorPresets),
  }
}

function mapDraftFromPayload(payload: Record<string, unknown>): ProductListingDraft {
  const base = createEmptyProductListingDraft(String(payload.originCountry ?? ''))
  return {
    ...base,
    sku: String(payload.sku ?? ''),
    approvalStatus: String(payload.approvalStatus ?? 'draft'),
    listingStep: Number(payload.listingStep ?? 1),
    categoryName: String(payload.categoryName ?? ''),
    subCategoryName: String(payload.subCategoryName ?? ''),
    productTypeName: String(payload.productTypeName ?? ''),
    hsnCode: String(payload.hsnCode ?? ''),
    itemConditionCode: String(payload.itemConditionCode ?? base.itemConditionCode),
    productName: String(payload.productName ?? ''),
    brandName: String(payload.brandName ?? ''),
    shortDescription: String(payload.shortDescription ?? ''),
    fullDescriptionBullets: Array.isArray(payload.fullDescriptionBullets)
      ? payload.fullDescriptionBullets.map(String)
      : [],
    specifications: Array.isArray(payload.specifications)
      ? payload.specifications.map((row, index) => {
          const spec = row as Record<string, unknown>
          return {
            attributeName: String(spec.attributeName ?? ''),
            attributeValue: String(spec.attributeValue ?? ''),
            sortOrder: Number(spec.sortOrder ?? index),
          }
        })
      : base.specifications,
    manufacturerName: String(payload.manufacturerName ?? ''),
    manufacturerCountry: String(payload.manufacturerCountry ?? ''),
    originCountry: String(payload.originCountry ?? ''),
    ingredients: String(payload.ingredients ?? ''),
    usageInstructions: String(payload.usageInstructions ?? ''),
    importantNote: String(payload.importantNote ?? ''),
    warrantyAvailable: Boolean(payload.warrantyAvailable),
    warrantyPeriodCode: String(payload.warrantyPeriodCode ?? ''),
    warrantyType: String(payload.warrantyType ?? ''),
    containsBattery: Boolean(payload.containsBattery),
    containsLiquid: Boolean(payload.containsLiquid),
    containsMagneticMaterial: Boolean(payload.containsMagneticMaterial),
    containsAerosol: Boolean(payload.containsAerosol),
    containsFlammableMaterial: Boolean(payload.containsFlammableMaterial),
    packageContentsBullets: Array.isArray(payload.packageContentsBullets)
      ? payload.packageContentsBullets.map(String)
      : [],
    variants: Array.isArray(payload.variants)
      ? payload.variants.map((row, index) => {
          const variant = row as Record<string, unknown>
          return {
            id: variant.id != null ? Number(variant.id) : undefined,
            variantId: String(variant.variantId ?? ''),
            size: String(variant.size ?? ''),
            color: String(variant.color ?? ''),
            mrp: Number(variant.mrp ?? 0),
            sellingPrice: Number(variant.sellingPrice ?? 0),
            stock: Number(variant.stock ?? 0),
            imageStoragePath: variant.imageStoragePath ? String(variant.imageStoragePath) : undefined,
            imageFileName: variant.fileName ? String(variant.fileName) : undefined,
            sortOrder: Number(variant.sortOrder ?? index),
          }
        })
      : [],
    media: Array.isArray(payload.media)
      ? payload.media.map((row, index) => {
          const media = row as Record<string, unknown>
          return {
            id: media.id != null ? Number(media.id) : undefined,
            mediaType: media.mediaType as MediaDraft['mediaType'],
            storagePath: String(media.storagePath ?? ''),
            fileName: String(media.fileName ?? ''),
            mimeType: media.mimeType ? String(media.mimeType) : undefined,
            slotIndex: media.slotIndex != null ? Number(media.slotIndex) : undefined,
            sortOrder: Number(media.sortOrder ?? index),
          }
        })
      : [],
    packageLength: Number(payload.packageLength ?? 0),
    packageWidth: Number(payload.packageWidth ?? 0),
    packageHeight: Number(payload.packageHeight ?? 0),
    packageLengthUnitCode: String(payload.packageLengthUnitCode ?? ''),
    packageWidthUnitCode: String(payload.packageWidthUnitCode ?? ''),
    packageHeightUnitCode: String(payload.packageHeightUnitCode ?? ''),
    packageWeight: Number(payload.packageWeight ?? 0),
    packageWeightUnitCode: String(payload.packageWeightUnitCode ?? ''),
    returnEligible: Boolean(payload.returnEligible),
    returnWindowCode: String(payload.returnWindowCode ?? ''),
    returnReasonCodes: Array.isArray(payload.returnReasonCodes)
      ? payload.returnReasonCodes.map(String)
      : [],
    declarationAccurate: Boolean(payload.declarationAccurate),
    declarationPolicy: Boolean(payload.declarationPolicy),
    declarationLegalRight: Boolean(payload.declarationLegalRight),
    declarationTerms: Boolean(payload.declarationTerms),
  }
}

export async function loadProductListingDraft(productId: number): Promise<ProductListingDraft | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_seller_product_listing_draft', {
    p_product_id: productId,
  })

  if (error || !data) return null
  return mapDraftFromPayload(data as Record<string, unknown>)
}

export async function saveProductListingDraft(
  draft: ProductListingDraft,
  productId: number | null,
  step: number,
  options?: { generateSku?: boolean },
): Promise<{ ok: true; productId: number; sku: string } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('save_seller_product_listing_draft', {
    p_product_id: productId,
    p_step: step,
    p_generate_sku: options?.generateSku ?? false,
    p_payload: {
      ...draft,
      listingStep: step,
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  const payload = data as Record<string, unknown>
  return {
    ok: true,
    productId: Number(payload.productId),
    sku: String(payload.sku ?? draft.sku),
  }
}

export async function submitProductListingForApproval(
  productId: number,
  draft: ProductListingDraft,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase.rpc('submit_seller_product_listing', {
    p_product_id: productId,
    p_payload: draft,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export function buildVariantId(size: string, color: string, index: number) {
  if (size === 'Free Size' && (!color || color === 'No Color')) {
    return 'AGT-DEFAULT-VAR'
  }
  const sizePart = size.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'FREE'
  const colorPart = color.replace(/\s+/g, '').slice(0, 3).toUpperCase() || 'NOC'
  return `AGT-VAR-${sizePart}-${colorPart}-${index + 1}`
}

export function validateStep1(draft: ProductListingDraft): string | null {
  if (!draft.categoryName || !draft.subCategoryName || !draft.productTypeName) {
    return 'Category, sub category, and product type are required.'
  }
  if (!draft.productName.trim()) return 'Product name is required.'
  if (draft.productName.length > PRODUCT_NAME_MAX) return `Product name must be ${PRODUCT_NAME_MAX} characters or fewer.`
  if (!draft.brandName.trim()) return 'Brand name is required.'
  if (draft.brandName.length > BRAND_NAME_MAX) return `Brand name must be ${BRAND_NAME_MAX} characters or fewer.`
  if (!draft.shortDescription.trim()) return 'Short description is required.'
  if (draft.shortDescription.length > SHORT_DESCRIPTION_MAX) {
    return `Short description must be ${SHORT_DESCRIPTION_MAX} characters or fewer.`
  }
  if (draft.fullDescriptionBullets.length === 0) return 'Full description requires at least one bullet point.'
  if (draft.fullDescriptionBullets.join('').length > FULL_DESCRIPTION_MAX) {
    return `Full description must be ${FULL_DESCRIPTION_MAX} characters or fewer.`
  }
  return null
}

export function validateStep2(draft: ProductListingDraft): string | null {
  if (!draft.manufacturerName.trim()) return 'Manufacturer name is required.'
  if (draft.manufacturerName.length > MANUFACTURER_NAME_MAX) {
    return `Manufacturer name must be ${MANUFACTURER_NAME_MAX} characters or fewer.`
  }
  if (!draft.manufacturerCountry.trim()) return 'Manufacturer country is required.'
  if (draft.warrantyAvailable) {
    if (!draft.warrantyPeriodCode) return 'Warranty period is required.'
    if (!draft.warrantyType.trim()) return 'Warranty type is required.'
  }
  if (draft.packageContentsBullets.length > PACKAGE_CONTENTS_MAX_BULLETS) {
    return `Package contents supports up to ${PACKAGE_CONTENTS_MAX_BULLETS} bullet points.`
  }
  return null
}

export function validateStep3(draft: ProductListingDraft): string | null {
  const imageCount = draft.media.filter((item) => item.mediaType === 'product_image').length
  if (imageCount < MIN_PRODUCT_IMAGES) {
    return `Upload at least ${MIN_PRODUCT_IMAGES} product images.`
  }
  if (draft.variants.length === 0) {
    return 'Add at least one variant with MRP, selling price, and stock.'
  }
  for (const variant of draft.variants) {
    if (variant.mrp <= 0 || variant.sellingPrice <= 0) {
      return 'Each variant needs MRP and selling price.'
    }
    if (variant.stock < 0) return 'Variant stock cannot be negative.'
  }
  return null
}

export function validateStep4(draft: ProductListingDraft): string | null {
  if (draft.packageLength <= 0 || draft.packageWidth <= 0 || draft.packageHeight <= 0 || draft.packageWeight <= 0) {
    return 'Package length, width, height, and weight are required.'
  }
  if (!draft.packageLengthUnitCode || !draft.packageWidthUnitCode || !draft.packageHeightUnitCode || !draft.packageWeightUnitCode) {
    return 'Package units are required.'
  }
  if (draft.returnEligible) {
    if (!draft.returnWindowCode) return 'Return window is required.'
    if (draft.returnReasonCodes.length === 0) return 'Select at least one return reason type.'
  }
  return null
}

export function validateStep5(draft: ProductListingDraft): string | null {
  if (!draft.declarationAccurate || !draft.declarationPolicy || !draft.declarationLegalRight || !draft.declarationTerms) {
    return 'Complete all seller declarations before submitting.'
  }
  return null
}
