import { supabase } from './supabase'

export type ProductSpecificationInput = {
  attributeName: string
  attributeValue: string
  sortOrder: number
}

export type ProductVariantInput = {
  id?: number
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
  mrp: number
  sellingPrice: number
  approvalStatus: string
  imageStoragePath: string | null
}

export type SellerProductCatalogueStats = {
  liveProducts: number
  lowStock: number
  outOfStock: number
}

export const SELLER_PRODUCTS_PAGE_SIZE = 25

export const SELLER_PRODUCT_LISTING_TUTORIAL_URL = 'https://www.youtube.com/'

export type SellerProductListingDetail = {
  productId: number
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
  approvalStatus: string
  specifications: ProductSpecificationInput[]
  variants: ProductVariantInput[]
  media: ProductMediaInput[]
}

export type ProductListingFieldOptions = {
  packingType: string[]
  sizePreset: string[]
  colorPreset: string[]
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

export function createVariantId(_size: string, _color: string, _index: number) {
  return ''
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

export async function fetchProductListingFieldOptions(): Promise<ProductListingFieldOptions> {
  const defaults: ProductListingFieldOptions = {
    packingType: [],
    sizePreset: [],
    colorPreset: [],
  }

  if (!supabase) return defaults

  const { data, error } = await supabase.rpc('list_product_listing_field_options')
  if (error || !data) return defaults

  return {
    packingType: Array.isArray(data.packing_type) ? data.packing_type.map(String) : [],
    sizePreset: Array.isArray(data.size_preset) ? data.size_preset.map(String) : [],
    colorPreset: Array.isArray(data.color_preset) ? data.color_preset.map(String) : [],
  }
}

function mapListingDetail(payload: Record<string, unknown>): SellerProductListingDetail {
  const product = payload.product as Record<string, unknown>
  const specifications = Array.isArray(payload.specifications) ? payload.specifications : []
  const variants = Array.isArray(payload.variants) ? payload.variants : []
  const media = Array.isArray(payload.media) ? payload.media : []

  return {
    productId: Number(product.id),
    sku: String(product.sku ?? ''),
    productName: String(product.product_name ?? ''),
    categoryName: String(product.category_name ?? ''),
    subCategoryName: String(product.sub_category_name ?? ''),
    productTypeName: String(product.product_type_name ?? ''),
    hsnCode: String(product.hsn_code ?? ''),
    brandName: String(product.brand_name ?? ''),
    shortDescription: String(product.short_description ?? ''),
    fullDescription: String(product.full_description ?? ''),
    packingType: String(product.packing_type ?? ''),
    weightKg: Number(product.weight_kg ?? 0),
    packageLengthCm: Number(product.package_length_cm ?? 0),
    packageWidthCm: Number(product.package_width_cm ?? 0),
    packageHeightCm: Number(product.package_height_cm ?? 0),
    manufacturerName: String(product.manufacturer_name ?? ''),
    manufacturerCountry: String(product.manufacturer_country ?? ''),
    originCountry: String(product.origin_country ?? ''),
    usageNote: String(product.usage_note ?? ''),
    ingredients: String(product.ingredients ?? ''),
    approvalStatus: String(product.approval_status ?? 'draft'),
    specifications: specifications.map((row, index) => {
      const spec = row as Record<string, unknown>
      return {
        attributeName: String(spec.attributeName ?? ''),
        attributeValue: String(spec.attributeValue ?? ''),
        sortOrder: Number(spec.sortOrder ?? index),
      }
    }),
    variants: variants.map((row, index) => {
      const variant = row as Record<string, unknown>
      return {
        id: variant.id ? Number(variant.id) : undefined,
        variantId: String(variant.variantId ?? ''),
        size: String(variant.size ?? ''),
        color: String(variant.color ?? ''),
        mrp: Number(variant.mrp ?? 0),
        sellingPrice: Number(variant.sellingPrice ?? 0),
        stock: Number(variant.stock ?? 0),
        imageStoragePath: variant.imageStoragePath ? String(variant.imageStoragePath) : undefined,
        sortOrder: Number(variant.sortOrder ?? index),
      }
    }),
    media: media.map((row, index) => {
      const item = row as Record<string, unknown>
      return {
        mediaType: item.mediaType as ProductMediaInput['mediaType'],
        storagePath: String(item.storagePath ?? ''),
        fileName: String(item.fileName ?? ''),
        mimeType: item.mimeType ? String(item.mimeType) : undefined,
        slotIndex: item.slotIndex != null ? Number(item.slotIndex) : undefined,
        sortOrder: Number(item.sortOrder ?? index),
      }
    }),
  }
}

export async function fetchSellerProductListing(productId: number): Promise<SellerProductListingDetail | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_seller_product_listing', { p_product_id: productId })
  if (error || !data) return null

  return mapListingDetail(data as Record<string, unknown>)
}

export async function updateSellerProductStock(
  productId: number,
  variants: Array<{ id: number; stock: number }>,
): Promise<{ ok: true; listing: SellerProductListingDetail } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('update_seller_product_stock', {
    p_product_id: productId,
    p_variants: variants.map((variant) => ({ id: variant.id, stock: variant.stock })),
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, listing: mapListingDetail(data as Record<string, unknown>) }
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
    .order('updated_at', { ascending: false })

  if (error || !products) return []

  const productIds = products.map((product) => product.id)
  if (productIds.length === 0) return []

  const [{ data: variants }, { data: media }] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, mrp, selling_price, stock')
      .in('product_id', productIds),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index')
      .in('product_id', productIds)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
  ])

  const variantSummary = new Map<number, { mrp: number; sellingPrice: number; stock: number }>()
  for (const variant of variants ?? []) {
    const current = variantSummary.get(variant.product_id)
    if (!current) {
      variantSummary.set(variant.product_id, {
        mrp: Number(variant.mrp ?? 0),
        sellingPrice: Number(variant.selling_price ?? 0),
        stock: Number(variant.stock ?? 0),
      })
      continue
    }

    variantSummary.set(variant.product_id, {
      mrp: Math.max(current.mrp, Number(variant.mrp ?? 0)),
      sellingPrice: current.sellingPrice || Number(variant.selling_price ?? 0),
      stock: current.stock + Number(variant.stock ?? 0),
    })
  }

  const imageByProduct = new Map<number, string>()
  for (const item of media ?? []) {
    if (!imageByProduct.has(item.product_id) && item.storage_path) {
      imageByProduct.set(item.product_id, item.storage_path)
    }
  }

  return products.map((product) => {
    const summary = variantSummary.get(product.id) ?? { mrp: 0, sellingPrice: 0, stock: 0 }
    return {
      id: product.id,
      productName: product.product_name,
      sku: product.sku,
      stock: summary.stock,
      mrp: summary.mrp,
      sellingPrice: summary.sellingPrice,
      approvalStatus: product.approval_status,
      imageStoragePath: imageByProduct.get(product.id) ?? null,
    }
  })
}

export function computeSellerProductCatalogueStats(rows: SellerProductCatalogueRow[]): SellerProductCatalogueStats {
  const approved = rows.filter((row) => row.approvalStatus === 'approved')
  return {
    liveProducts: approved.length,
    lowStock: approved.filter((row) => row.stock > 0 && row.stock < 5).length,
    outOfStock: approved.filter((row) => row.stock === 0).length,
  }
}

export function filterSellerProductsByTab(rows: SellerProductCatalogueRow[], tab: string) {
  if (tab === 'approved') {
    return rows.filter((row) => row.approvalStatus === 'approved')
  }
  if (tab === 'rejected') {
    return rows.filter((row) => row.approvalStatus === 'rejected')
  }
  return rows.filter((row) => row.approvalStatus === 'draft' || row.approvalStatus === 'pending')
}

export async function deleteSellerProduct(productId: number): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in as a seller.' }
  }

  const { error } = await supabase
    .from('seller_products')
    .delete()
    .eq('id', productId)
    .eq('user_id', user.id)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
