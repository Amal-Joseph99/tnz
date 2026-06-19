import { supabase } from './supabase'
import { fetchProductCardsByIds } from './storefrontCatalog'

export type HighlightSection = 'featured' | 'trending'

export const HIGHLIGHT_SECTION_LIMIT = 100

export type SellerWithProducts = {
  userId: string
  businessName: string
  countryName: string
  productCount: number
}

export type ApprovedProductOption = {
  id: number
  sku: string
  productName: string
  brandName: string
  categoryName: string
  subCategoryName: string
  productTypeName: string
}

export type HighlightEntry = {
  id: number
  productId: number
  sectionType: HighlightSection
  sortOrder: number
  productName: string
  sku: string
  brandName: string
  sellerBusinessName: string
}

type MutationResult = { ok: true } | { ok: false; message: string }

export async function fetchHighlightSectionProducts(sectionType: HighlightSection) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('storefront_highlight_products')
    .select('product_id, sort_order')
    .eq('section_type', sectionType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data?.length) return []

  const productIds = data.map((row) => row.product_id as number)
  return fetchProductCardsByIds(productIds)
}

export async function fetchSellersWithApprovedProducts(): Promise<SellerWithProducts[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_sellers_with_approved_products')
  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => ({
    userId: String(row.user_id),
    businessName: String(row.business_name),
    countryName: String(row.country_name),
    productCount: Number(row.product_count),
  }))
}

export async function fetchApprovedProductsBySeller(userId: string): Promise<ApprovedProductOption[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_approved_products_by_seller', {
    p_user_id: userId,
  })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => ({
    id: Number(row.id),
    sku: String(row.sku),
    productName: String(row.product_name),
    brandName: String(row.brand_name),
    categoryName: String(row.category_name),
    subCategoryName: String(row.sub_category_name),
    productTypeName: String(row.product_type_name),
  }))
}

export async function fetchSectionHighlights(sectionType: HighlightSection): Promise<HighlightEntry[]> {
  if (!supabase) return []

  const { data: highlights, error } = await supabase
    .from('storefront_highlight_products')
    .select('id, product_id, section_type, sort_order, is_active')
    .eq('section_type', sectionType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !highlights?.length) return []

  const productIds = highlights.map((row) => row.product_id)
  const { data: products } = await supabase
    .from('seller_products')
    .select('id, product_name, sku, brand_name, user_id')
    .in('id', productIds)

  const sellerIds = [...new Set((products ?? []).map((product) => product.user_id))]
  const { data: sellers } = sellerIds.length
    ? await supabase.from('seller_accounts').select('user_id, business_name').in('user_id', sellerIds)
    : { data: [] }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]))
  const sellerMap = new Map((sellers ?? []).map((seller) => [seller.user_id, seller.business_name]))

  return highlights.map((row) => {
    const product = productMap.get(row.product_id)
    return {
      id: row.id,
      productId: row.product_id,
      sectionType: row.section_type as HighlightSection,
      sortOrder: row.sort_order,
      productName: product?.product_name ?? 'Unknown product',
      sku: product?.sku ?? '—',
      brandName: product?.brand_name ?? '—',
      sellerBusinessName: product ? String(sellerMap.get(product.user_id) ?? '—') : '—',
    }
  })
}

export async function addProductToSection(
  productId: number,
  sectionType: HighlightSection,
  sortOrder?: number,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { count, error: countError } = await supabase
    .from('storefront_highlight_products')
    .select('id', { count: 'exact', head: true })
    .eq('section_type', sectionType)
    .eq('is_active', true)

  if (countError) {
    return { ok: false, message: countError.message }
  }

  if ((count ?? 0) >= HIGHLIGHT_SECTION_LIMIT) {
    return { ok: false, message: `Maximum ${HIGHLIGHT_SECTION_LIMIT} products allowed in this section.` }
  }

  const nextSortOrder = sortOrder ?? (count ?? 0) + 1

  const { error } = await supabase.from('storefront_highlight_products').upsert(
    {
      product_id: productId,
      section_type: sectionType,
      sort_order: nextSortOrder,
      is_active: true,
    },
    { onConflict: 'product_id,section_type' },
  )

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function updateHighlightSortOrder(
  highlightId: number,
  sortOrder: number,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase
    .from('storefront_highlight_products')
    .update({ sort_order: sortOrder })
    .eq('id', highlightId)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function removeHighlight(highlightId: number): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase
    .from('storefront_highlight_products')
    .delete()
    .eq('id', highlightId)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
