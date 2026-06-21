import {
  fetchProductListingWizardOptions,
  type ProductListingWizardOptions,
  type WizardOption,
} from './productListingWizard'

export const PRODUCT_DECLARATION_ITEMS = [
  { key: 'declaration_accurate', label: 'All information provided is accurate.' },
  { key: 'declaration_policy', label: 'This product does not violate AGTRENZ policies.' },
  { key: 'declaration_legal_right', label: 'Seller has the legal right to sell this product.' },
  { key: 'declaration_terms', label: 'Seller agrees to AGTRENZ Seller Terms & Conditions.' },
] as const

export const DANGEROUS_GOODS_FIELDS = [
  { key: 'contains_battery', label: 'Contains battery' },
  { key: 'contains_liquid', label: 'Contains liquid' },
  { key: 'contains_magnetic_material', label: 'Contains magnetic material' },
  { key: 'contains_aerosol', label: 'Contains aerosol' },
  { key: 'contains_flammable_material', label: 'Contains flammable material' },
] as const

export function parseBulletArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

export function optionLabel(options: WizardOption[], code: string | null | undefined) {
  if (!code) return '—'
  return options.find((item) => item.code === code)?.label ?? code
}

export function buildOptionLabelMap(options: WizardOption[]) {
  return Object.fromEntries(options.map((item) => [item.code, item.label]))
}

export function formatYesNo(value: boolean | null | undefined) {
  if (value == null) return '—'
  return value ? 'Yes' : 'No'
}

export function formatPackageDimensions(product: Record<string, unknown>, labels: ProductListingWizardOptions) {
  const length = product.package_length_cm
  const width = product.package_width_cm
  const height = product.package_height_cm
  const lengthUnit = optionLabel(labels.dimensionUnits, String(product.package_length_unit_code ?? 'cm'))
  const widthUnit = optionLabel(labels.dimensionUnits, String(product.package_width_unit_code ?? 'cm'))
  const heightUnit = optionLabel(labels.dimensionUnits, String(product.package_height_unit_code ?? 'cm'))

  if (length == null && width == null && height == null) return '—'

  return `${length ?? '—'} ${lengthUnit} × ${width ?? '—'} ${widthUnit} × ${height ?? '—'} ${heightUnit}`
}

export function formatPackageWeight(product: Record<string, unknown>, labels: ProductListingWizardOptions) {
  const weight = product.weight_kg ?? product.package_weight
  if (weight == null) return '—'
  const unit = optionLabel(labels.weightUnits, String(product.package_weight_unit_code ?? 'kg'))
  return `${weight} ${unit}`
}

export function formatReturnReasons(codes: unknown, labels: ProductListingWizardOptions) {
  const list = Array.isArray(codes) ? codes.map(String) : []
  if (list.length === 0) return '—'
  return list.map((code) => optionLabel(labels.returnReasonTypes, code)).join(', ')
}

export function readDangerousGoodsFlags(product: Record<string, unknown>) {
  return DANGEROUS_GOODS_FIELDS.filter((field) => Boolean(product[field.key]))
}

export function aboutProductBullets(product: Record<string, unknown>) {
  const bullets = parseBulletArray(product.full_description_bullets)
  if (bullets.length > 0) return bullets

  const legacy = String(product.full_description ?? '').trim()
  if (!legacy) return []

  return legacy
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean)
}

export function usageText(product: Record<string, unknown>) {
  const instructions = String(product.usage_instructions ?? '').trim()
  if (instructions) return instructions
  return String(product.usage_note ?? '').trim()
}

let cachedOptions: ProductListingWizardOptions | null = null
let cachePromise: Promise<ProductListingWizardOptions> | null = null

export async function fetchProductListingDisplayOptions() {
  if (cachedOptions) return cachedOptions
  if (!cachePromise) {
    cachePromise = fetchProductListingWizardOptions().then((options) => {
      cachedOptions = options
      return options
    })
  }
  return cachePromise
}
