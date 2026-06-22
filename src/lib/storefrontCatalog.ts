import type { Product } from '../data/products'
import { fetchProductListingDisplayOptions } from './productListingDisplay'
import { supabase } from './supabase'
import { getCategorySlug, getSubcategorySlug, resolveNameFromSlug } from './categoryDisplay'
import { fetchCategoryTaxonomy, fetchStorefrontCategoryNames } from './catalogCategories'

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

type SellerProductRow = {
  id: number
  user_id: string
  product_name: string
  brand_name: string
  category_name: string
  sub_category_name: string
  product_type_name: string
  short_description: string | null
  sku: string
}

type CatalogVariantPrice = {
  mrp: number
  selling_price: number
  image_storage_path?: string | null
  variant_id?: string
}

type StorefrontVariantRow = {
  variant_id: string
  size: string
  color: string
  mrp: number
  selling_price: number
  stock: number
  image_storage_path?: string | null
}

export type StorefrontProductMedia = {
  url: string
  storagePath: string
  mediaType: 'product_image' | 'product_video' | 'description_image'
  fileName?: string
  mimeType?: string
}

export type StorefrontProductDetail = {
  id: number
  user_id: string
  product_name: string
  brand_name: string
  category_name: string
  sub_category_name: string
  product_type_name: string
  short_description: string | null
  full_description: string | null
  full_description_bullets: unknown
  sku: string
  hsn_code: string
  item_condition_code: string | null
  packing_type: string | null
  weight_kg: number | null
  package_length_cm: number | null
  package_width_cm: number | null
  package_height_cm: number | null
  package_length_unit_code: string | null
  package_width_unit_code: string | null
  package_height_unit_code: string | null
  package_weight_unit_code: string | null
  manufacturer_name: string | null
  manufacturer_country: string | null
  origin_country: string | null
  usage_note: string | null
  usage_instructions: string | null
  important_note: string | null
  ingredients: string | null
  package_contents_bullets: unknown
  warranty_available: boolean | null
  warranty_period_code: string | null
  warranty_type: string | null
  contains_battery: boolean | null
  contains_liquid: boolean | null
  contains_magnetic_material: boolean | null
  contains_aerosol: boolean | null
  contains_flammable_material: boolean | null
  return_eligible: boolean | null
  return_window_code: string | null
  return_reason_codes: string[] | null
  variants: StorefrontVariantRow[]
  media: StorefrontProductMedia[]
  specifications: Array<{ attribute_name: string; attribute_value: string }>
}

function getProductImageUrl(storagePath: string | undefined) {
  if (!storagePath || !supabase) return PRODUCT_PLACEHOLDER

  const { data } = supabase.storage.from('seller-products').getPublicUrl(storagePath)
  return data.publicUrl || PRODUCT_PLACEHOLDER
}

export function getStorefrontProductImageUrl(storagePath: string | undefined) {
  return getProductImageUrl(storagePath)
}

function mapToProductCard(
  product: SellerProductRow,
  variant: CatalogVariantPrice | undefined,
  imagePaths: string[],
  listingCurrencyCode: string,
): Product {
  const price = variant?.selling_price ?? 0
  const originalPrice = variant?.mrp ?? price
  const hasDiscount = originalPrice > price && price > 0
  const discountPercent = hasDiscount
    ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% off`
    : undefined

  const images = imagePaths.map((path) => getProductImageUrl(path))
  const image = images[0] ?? PRODUCT_PLACEHOLDER

  return {
    id: String(product.id),
    title: product.product_name,
    brand: product.brand_name,
    price,
    originalPrice: hasDiscount ? originalPrice : undefined,
    discount: discountPercent,
    rating: 0,
    reviews: 0,
    image,
    images: images.length > 0 ? images : [image],
    listingCurrencyCode,
    sellerUserId: product.user_id,
    sku: product.sku,
    variantId: variant?.variant_id,
  }
}

async function fetchSellerCurrencyMap(userIds: string[]) {
  if (!supabase || userIds.length === 0) return new Map<string, string>()

  const { data, error } = await supabase.rpc('list_seller_listing_currencies', {
    p_user_ids: userIds,
  })

  if (error || !data) return new Map<string, string>()

  return new Map(
    (data as Array<{ user_id: string; base_currency_code: string }>).map((row) => [
      String(row.user_id),
      String(row.base_currency_code ?? 'INR'),
    ]),
  )
}

function pickPrimaryVariant(variants: Array<{
  product_id: number
  mrp: number
  selling_price: number
  image_storage_path?: string | null
  variant_id?: string
}>) {
  const variantByProduct = new Map<number, CatalogVariantPrice>()

  for (const variant of variants) {
    const existing = variantByProduct.get(variant.product_id)
    if (!existing || variant.selling_price < existing.selling_price) {
      variantByProduct.set(variant.product_id, {
        mrp: variant.mrp,
        selling_price: variant.selling_price,
        image_storage_path: variant.image_storage_path,
        variant_id: variant.variant_id,
      })
    }
  }

  return variantByProduct
}

function pickProductListingImages(
  media: Array<{ product_id: number; storage_path: string; slot_index?: number | null; sort_order?: number | null }>,
) {
  const imagePathsByProduct = new Map<number, string[]>()

  const sortedMedia = [...media].sort((left, right) => {
    const leftOrder = left.sort_order ?? left.slot_index ?? 0
    const rightOrder = right.sort_order ?? right.slot_index ?? 0
    return leftOrder - rightOrder
  })

  for (const item of sortedMedia) {
    const paths = imagePathsByProduct.get(item.product_id) ?? []
    if (paths.length >= 5) continue
    paths.push(item.storage_path)
    imagePathsByProduct.set(item.product_id, paths)
  }

  return imagePathsByProduct
}

export async function resolveCategoryNameFromSlug(slug: string) {
  const names = await fetchStorefrontCategoryNames()
  return resolveNameFromSlug(names, slug)
}

export async function fetchSubcategoriesForCategory(categoryName: string) {
  const rows = await fetchCategoryTaxonomy()
  const subcategories = new Set<string>()

  for (const row of rows) {
    if (row.category_name === categoryName) {
      subcategories.add(row.sub_category_name)
    }
  }

  return [...subcategories].sort((a, b) => a.localeCompare(b))
}

export async function resolveSubcategoryNameFromSlug(
  categoryName: string,
  slug: string | undefined,
) {
  if (!slug) return null
  const subcategories = await fetchSubcategoriesForCategory(categoryName)
  return subcategories.find((name) => getSubcategorySlug(name) === slug) ?? null
}

export async function fetchStorefrontProductsByCategory(
  categoryName: string,
  subCategoryName?: string | null,
): Promise<Product[]> {
  if (!supabase) return []

  let query = supabase
    .from('seller_products')
    .select('id, user_id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description, sku')
    .eq('approval_status', 'approved')
    .eq('category_name', categoryName)
    .order('updated_at', { ascending: false })

  if (subCategoryName) {
    query = query.eq('sub_category_name', subCategoryName)
  }

  const { data: products, error } = await query
  if (error || !products?.length) return []

  const productIds = products.map((product) => product.id)
  const sellerIds = [...new Set(products.map((product) => product.user_id))]

  const [{ data: variants }, { data: media }, sellerCurrencyMap] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, variant_id, mrp, selling_price, image_storage_path')
      .in('product_id', productIds),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index, sort_order')
      .in('product_id', productIds)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
    fetchSellerCurrencyMap(sellerIds),
  ])

  const variantByProduct = pickPrimaryVariant(variants ?? [])
  const imagesByProduct = pickProductListingImages(media ?? [])

  return (products as SellerProductRow[]).map((product) =>
    mapToProductCard(
      product,
      variantByProduct.get(product.id),
      imagesByProduct.get(product.id) ?? [],
      sellerCurrencyMap.get(product.user_id) ?? 'INR',
    ),
  )
}

export async function fetchProductCardsByIds(productIds: number[]): Promise<Product[]> {
  if (!supabase || productIds.length === 0) return []

  const { data: products, error } = await supabase
    .from('seller_products')
    .select('id, user_id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description, sku')
    .in('id', productIds)
    .eq('approval_status', 'approved')

  if (error || !products?.length) return []

  const ids = products.map((product) => product.id)
  const sellerIds = [...new Set(products.map((product) => product.user_id))]

  const [{ data: variants }, { data: media }, sellerCurrencyMap] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, variant_id, mrp, selling_price, image_storage_path')
      .in('product_id', ids),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index, sort_order')
      .in('product_id', ids)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
    fetchSellerCurrencyMap(sellerIds),
  ])

  const variantByProduct = pickPrimaryVariant(variants ?? [])
  const imagesByProduct = pickProductListingImages(media ?? [])

  const productById = new Map(
    (products as SellerProductRow[]).map((product) => [
      product.id,
      mapToProductCard(
        product,
        variantByProduct.get(product.id),
        imagesByProduct.get(product.id) ?? [],
        sellerCurrencyMap.get(product.user_id) ?? 'INR',
      ),
    ]),
  )

  return productIds
    .map((id) => productById.get(id))
    .filter((product): product is Product => Boolean(product))
}

export async function fetchStorefrontProductById(productId: number) {
  if (!supabase || !Number.isFinite(productId)) return null

  const [{ data: product, error }, listingOptions] = await Promise.all([
    supabase
      .from('seller_products')
      .select(`
        id, user_id, product_name, brand_name, category_name, sub_category_name, product_type_name,
        short_description, full_description, full_description_bullets, sku, hsn_code, item_condition_code,
        packing_type, weight_kg, package_length_cm, package_width_cm, package_height_cm,
        package_length_unit_code, package_width_unit_code, package_height_unit_code, package_weight_unit_code,
        manufacturer_name, manufacturer_country, origin_country, usage_note, usage_instructions, important_note,
        ingredients, package_contents_bullets, warranty_available, warranty_period_code, warranty_type,
        contains_battery, contains_liquid, contains_magnetic_material, contains_aerosol, contains_flammable_material,
        return_eligible, return_window_code, return_reason_codes
      `)
      .eq('id', productId)
      .eq('approval_status', 'approved')
      .maybeSingle(),
    fetchProductListingDisplayOptions(),
  ])

  if (error || !product) return null

  const [{ data: variants }, { data: media }, { data: specs }, sellerCurrencyMap] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('variant_id, size, color, mrp, selling_price, stock, image_storage_path')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('seller_product_media')
      .select('storage_path, slot_index, sort_order, media_type, file_name, mime_type')
      .eq('product_id', productId)
      .in('media_type', ['product_image', 'description_image', 'product_video'])
      .order('sort_order', { ascending: true }),
    supabase
      .from('seller_product_specifications')
      .select('attribute_name, attribute_value')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true }),
    fetchSellerCurrencyMap([String(product.user_id)]),
  ])

  const primaryVariant = (variants ?? [])[0]
  const listingImagePaths = pickProductListingImages(
    (media ?? [])
      .filter((item) => item.media_type === 'product_image')
      .map((item) => ({
        product_id: productId,
        storage_path: item.storage_path,
        slot_index: item.slot_index,
        sort_order: item.sort_order,
      })),
  ).get(productId) ?? []

  const card = mapToProductCard(
    product as SellerProductRow,
    primaryVariant
      ? {
          mrp: primaryVariant.mrp,
          selling_price: primaryVariant.selling_price,
          image_storage_path: primaryVariant.image_storage_path,
          variant_id: primaryVariant.variant_id,
        }
      : undefined,
    listingImagePaths,
    sellerCurrencyMap.get(String(product.user_id)) ?? 'INR',
  )

  const mappedMedia: StorefrontProductMedia[] = (media ?? []).map((item) => ({
    url: getProductImageUrl(item.storage_path),
    storagePath: item.storage_path,
    mediaType: item.media_type as StorefrontProductMedia['mediaType'],
    fileName: item.file_name ?? undefined,
    mimeType: item.mime_type ?? undefined,
  }))

  return {
    card,
    detail: {
      ...(product as StorefrontProductDetail),
      variants: (variants ?? []) as StorefrontVariantRow[],
      media: mappedMedia,
      specifications: specs ?? [],
    },
    listingOptions,
  }
}

export function buildCategoryBrowsePath(categoryName: string, subCategoryName?: string) {
  const base = `/category/${getCategorySlug(categoryName)}`
  if (!subCategoryName) return base
  return `${base}/${getSubcategorySlug(subCategoryName)}`
}

export async function searchStorefrontProducts(query: string): Promise<Product[]> {
  if (!supabase) return []

  const term = query.trim()
  if (!term) return []

  const pattern = `%${term.replace(/[%_]/g, '')}%`

  const { data: products, error } = await supabase
    .from('seller_products')
    .select('id, user_id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description, sku')
    .eq('approval_status', 'approved')
    .or(`product_name.ilike."${pattern}",brand_name.ilike."${pattern}"`)
    .order('updated_at', { ascending: false })
    .limit(48)

  if (error || !products?.length) return []

  const productIds = products.map((product) => product.id)
  const sellerIds = [...new Set(products.map((product) => product.user_id))]

  const [{ data: variants }, { data: media }, sellerCurrencyMap] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, variant_id, mrp, selling_price, image_storage_path')
      .in('product_id', productIds),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index, sort_order')
      .in('product_id', productIds)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
    fetchSellerCurrencyMap(sellerIds),
  ])

  const variantByProduct = pickPrimaryVariant(variants ?? [])
  const imagesByProduct = pickProductListingImages(media ?? [])

  return (products as SellerProductRow[]).map((product) =>
    mapToProductCard(
      product,
      variantByProduct.get(product.id),
      imagesByProduct.get(product.id) ?? [],
      sellerCurrencyMap.get(product.user_id) ?? 'INR',
    ),
  )
}
