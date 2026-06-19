import { supabase } from './supabase'

export type ProductSpecificationInput = {
  attributeName: string
  attributeValue: string
  sortOrder: number
}

export type ProductVariantInput = {
  variantId: string
  size: string
  color: string
  mrp: number
  sellingPrice: number
  stock: number
  imageStoragePath?: string
  sortOrder: number
}

export type ProductMediaInput = {
  mediaType: 'product_image' | 'product_video' | 'description_image'
  storagePath: string
  fileName: string
  mimeType?: string
  slotIndex?: number
  sortOrder: number
}

export type SellerProductListingInput = {
  productId?: number
  sku: string
  productName: string
  categoryName: string
  subCategoryName: string
  productTypeName: string
  hsnCode: string
  brandName: string
  shortDescription: string
  fullDescription: string
  packingType: string
  weightKg: number
  packageLengthCm: number
  packageWidthCm: number
  packageHeightCm: number
  manufacturerName: string
  manufacturerCountry: string
  originCountry: string
  usageNote: string
  ingredients: string
  specifications: ProductSpecificationInput[]
  variants: ProductVariantInput[]
  media: ProductMediaInput[]
  submitForApproval: boolean
}

export type SellerProductCatalogueRow = {
  id: number
  productName: string
  sku: string
  stock: number
  approvalStatus: string
}

type MutationResult = { ok: true; productId: number } | { ok: false; message: string }

export function parseMoneyInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, '')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function createSku(productName: string) {
  const prefix = productName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')

  return `AGT-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
}

export function createVariantId(size: string, color: string, index: number) {
  if (size === 'Free Size') return 'AGT-DEFAULT-VAR'
  return `AGT-VAR-${size.slice(0, 2).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${index + 1}`
}

export async function saveSellerProductListing(
  input: SellerProductListingInput,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('save_seller_product_listing', {
    p_payload: {
      productId: input.productId ?? null,
      sku: input.sku,
      productName: input.productName,
      categoryName: input.categoryName,
      subCategoryName: input.subCategoryName,
      productTypeName: input.productTypeName,
      hsnCode: input.hsnCode,
      brandName: input.brandName,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      packingType: input.packingType,
      weightKg: input.weightKg,
      packageLengthCm: input.packageLengthCm,
      packageWidthCm: input.packageWidthCm,
      packageHeightCm: input.packageHeightCm,
      manufacturerName: input.manufacturerName,
      manufacturerCountry: input.manufacturerCountry,
      originCountry: input.originCountry,
      usageNote: input.usageNote,
      ingredients: input.ingredients,
      specifications: input.specifications,
      variants: input.variants,
      media: input.media,
      submitForApproval: input.submitForApproval,
    },
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, productId: Number(data) }
}

export async function fetchSellerProductCatalogue(): Promise<SellerProductCatalogueRow[]> {
  if (!supabase) return []

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return []

  const { data: products, error } = await supabase
    .from('seller_products')
    .select('id, product_name, sku, approval_status')
    .eq('user_id', user.id)
    .neq('approval_status', 'draft')
    .order('updated_at', { ascending: false })

  if (error || !products) return []

  const rows: SellerProductCatalogueRow[] = []

  for (const product of products) {
    const { data: variants } = await supabase
      .from('seller_product_variants')
      .select('stock')
      .eq('product_id', product.id)

    const stock = (variants ?? []).reduce((sum, variant) => sum + (variant.stock ?? 0), 0)

    rows.push({
      id: product.id,
      productName: product.product_name,
      sku: product.sku,
      stock,
      approvalStatus: product.approval_status,
    })
  }

  return rows
}
