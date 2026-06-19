import type { Product } from '../data/products'
import { supabase } from './supabase'
import { getCategorySlug, getSubcategorySlug, resolveNameFromSlug } from './categoryDisplay'
import { fetchCategoryTaxonomy, fetchStorefrontCategoryNames } from './catalogCategories'

const PRODUCT_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EAGTRENZ%3C/text%3E%3C/svg%3E'

type SellerProductRow = {
  id: number
  product_name: string
  brand_name: string
  category_name: string
  sub_category_name: string
  product_type_name: string
  short_description: string | null
}

type VariantRow = {
  mrp: number
  selling_price: number
}

function getProductImageUrl(storagePath: string | undefined) {
  if (!storagePath || !supabase) return PRODUCT_PLACEHOLDER

  const { data } = supabase.storage.from('seller-products').getPublicUrl(storagePath)
  return data.publicUrl || PRODUCT_PLACEHOLDER
}

function mapToProductCard(
  product: SellerProductRow,
  variant: VariantRow | undefined,
  imagePath: string | undefined,
): Product {
  const price = variant?.selling_price ?? 0
  const originalPrice = variant?.mrp ?? price
  const hasDiscount = originalPrice > price && price > 0
  const discountPercent = hasDiscount
    ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% off`
    : undefined

  return {
    id: String(product.id),
    title: product.product_name,
    brand: product.brand_name,
    price,
    originalPrice: hasDiscount ? originalPrice : undefined,
    discount: discountPercent,
    rating: 0,
    reviews: 0,
    image: getProductImageUrl(imagePath),
  }
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
    .select('id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description')
    .eq('approval_status', 'approved')
    .eq('category_name', categoryName)
    .order('updated_at', { ascending: false })

  if (subCategoryName) {
    query = query.eq('sub_category_name', subCategoryName)
  }

  const { data: products, error } = await query
  if (error || !products?.length) return []

  const productIds = products.map((product) => product.id)

  const [{ data: variants }, { data: media }] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, mrp, selling_price')
      .in('product_id', productIds),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index')
      .in('product_id', productIds)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
  ])

  const variantByProduct = new Map<number, VariantRow>()
  for (const variant of variants ?? []) {
    const existing = variantByProduct.get(variant.product_id)
    if (!existing || variant.selling_price < existing.selling_price) {
      variantByProduct.set(variant.product_id, {
        mrp: variant.mrp,
        selling_price: variant.selling_price,
      })
    }
  }

  const imageByProduct = new Map<number, string>()
  for (const item of media ?? []) {
    if (!imageByProduct.has(item.product_id)) {
      imageByProduct.set(item.product_id, item.storage_path)
    }
  }

  return (products as SellerProductRow[]).map((product) =>
    mapToProductCard(
      product,
      variantByProduct.get(product.id),
      imageByProduct.get(product.id),
    ),
  )
}

export async function fetchProductCardsByIds(productIds: number[]): Promise<Product[]> {
  if (!supabase || productIds.length === 0) return []

  const { data: products, error } = await supabase
    .from('seller_products')
    .select('id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description')
    .in('id', productIds)
    .eq('approval_status', 'approved')

  if (error || !products?.length) return []

  const ids = products.map((product) => product.id)

  const [{ data: variants }, { data: media }] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('product_id, mrp, selling_price')
      .in('product_id', ids),
    supabase
      .from('seller_product_media')
      .select('product_id, storage_path, slot_index')
      .in('product_id', ids)
      .eq('media_type', 'product_image')
      .order('slot_index', { ascending: true }),
  ])

  const variantByProduct = new Map<number, VariantRow>()
  for (const variant of variants ?? []) {
    const existing = variantByProduct.get(variant.product_id)
    if (!existing || variant.selling_price < existing.selling_price) {
      variantByProduct.set(variant.product_id, {
        mrp: variant.mrp,
        selling_price: variant.selling_price,
      })
    }
  }

  const imageByProduct = new Map<number, string>()
  for (const item of media ?? []) {
    if (!imageByProduct.has(item.product_id)) {
      imageByProduct.set(item.product_id, item.storage_path)
    }
  }

  const productById = new Map(
    (products as SellerProductRow[]).map((product) => [
      product.id,
      mapToProductCard(product, variantByProduct.get(product.id), imageByProduct.get(product.id)),
    ]),
  )

  return productIds
    .map((id) => productById.get(id))
    .filter((product): product is Product => Boolean(product))
}

export async function fetchStorefrontProductById(productId: number) {
  if (!supabase || !Number.isFinite(productId)) return null

  const { data: product, error } = await supabase
    .from('seller_products')
    .select('id, product_name, brand_name, category_name, sub_category_name, product_type_name, short_description, full_description, sku, hsn_code, packing_type, weight_kg, package_length_cm, package_width_cm, package_height_cm, manufacturer_name, manufacturer_country, origin_country, usage_note, ingredients')
    .eq('id', productId)
    .eq('approval_status', 'approved')
    .maybeSingle()

  if (error || !product) return null

  const [{ data: variants }, { data: media }, { data: specs }] = await Promise.all([
    supabase
      .from('seller_product_variants')
      .select('variant_id, size, color, mrp, selling_price, stock')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('seller_product_media')
      .select('storage_path, slot_index, media_type')
      .eq('product_id', productId)
      .in('media_type', ['product_image', 'description_image'])
      .order('sort_order', { ascending: true }),
    supabase
      .from('seller_product_specifications')
      .select('attribute_name, attribute_value')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true }),
  ])

  const primaryVariant = (variants ?? [])[0]
  const card = mapToProductCard(
    product as SellerProductRow,
    primaryVariant
      ? { mrp: primaryVariant.mrp, selling_price: primaryVariant.selling_price }
      : undefined,
    (media ?? []).find((item) => item.media_type === 'product_image')?.storage_path,
  )

  return {
    card,
    detail: {
      ...product,
      variants: variants ?? [],
      media: (media ?? []).map((item) => getProductImageUrl(item.storage_path)),
      specifications: specs ?? [],
    },
  }
}

export function buildCategoryBrowsePath(categoryName: string, subCategoryName?: string) {
  const base = `/category/${getCategorySlug(categoryName)}`
  if (!subCategoryName) return base
  return `${base}/${getSubcategorySlug(subCategoryName)}`
}
