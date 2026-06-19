import { supabase } from './supabase'

export type CategoryTaxonomyRow = {
  id: number
  category_name: string
  sub_category_name: string
  product_type_name: string
  hsn_code: string
  is_active: boolean
}

export type CategoryTaxonomyInput = {
  categoryName: string
  subCategoryName: string
  productTypeName: string
  hsnCode: string
}

export type CategoryTree = Record<
  string,
  Record<string, { productTypes: string[]; hsnByType: Record<string, string> }>
>

type MutationResult =
  | { ok: true }
  | { ok: false; message: string }

function normalizeHsn(code: string) {
  return code.replace(/\D/g, '').slice(0, 8)
}

export function isValidHsnCode(code: string) {
  return /^\d{8}$/.test(normalizeHsn(code))
}

export function buildCategoryTree(rows: CategoryTaxonomyRow[]): CategoryTree {
  const tree: CategoryTree = {}

  for (const row of rows) {
    if (!tree[row.category_name]) {
      tree[row.category_name] = {}
    }

    if (!tree[row.category_name][row.sub_category_name]) {
      tree[row.category_name][row.sub_category_name] = {
        productTypes: [],
        hsnByType: {},
      }
    }

    const bucket = tree[row.category_name][row.sub_category_name]
    if (!bucket.productTypes.includes(row.product_type_name)) {
      bucket.productTypes.push(row.product_type_name)
    }
    bucket.hsnByType[row.product_type_name] = row.hsn_code
  }

  return tree
}

export function getHsnFromTree(
  tree: CategoryTree,
  category: string,
  subCategory: string,
  productType: string,
) {
  return tree[category]?.[subCategory]?.hsnByType[productType] ?? '00000000'
}

export async function fetchCategoryTaxonomy(includeInactive = false): Promise<CategoryTaxonomyRow[]> {
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('product_category_taxonomy')
    .select('id, category_name, sub_category_name, product_type_name, hsn_code, is_active')
    .order('category_name')
    .order('sub_category_name')
    .order('product_type_name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as CategoryTaxonomyRow[]
}

export async function fetchStorefrontCategoryNames(): Promise<string[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('storefront_categories')
    .select('category_name')
    .order('category_name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => row.category_name as string)
}

export async function createCategoryTaxonomy(input: CategoryTaxonomyInput): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const hsnCode = normalizeHsn(input.hsnCode)
  if (!isValidHsnCode(hsnCode)) {
    return { ok: false, message: 'HSN code must be exactly 8 digits.' }
  }

  const { error } = await supabase.from('product_category_taxonomy').insert({
    category_name: input.categoryName.trim(),
    sub_category_name: input.subCategoryName.trim(),
    product_type_name: input.productTypeName.trim(),
    hsn_code: hsnCode,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function updateCategoryTaxonomy(
  id: number,
  input: CategoryTaxonomyInput,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const hsnCode = normalizeHsn(input.hsnCode)
  if (!isValidHsnCode(hsnCode)) {
    return { ok: false, message: 'HSN code must be exactly 8 digits.' }
  }

  const { error } = await supabase
    .from('product_category_taxonomy')
    .update({
      category_name: input.categoryName.trim(),
      sub_category_name: input.subCategoryName.trim(),
      product_type_name: input.productTypeName.trim(),
      hsn_code: hsnCode,
    })
    .eq('id', id)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function deleteCategoryTaxonomy(id: number): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase
    .from('product_category_taxonomy')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
