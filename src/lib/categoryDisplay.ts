const CATEGORY_ICONS = ['electronics', 'fashion', 'home', 'beauty', 'luggage', 'combo', 'grocery', 'others'] as const

/** Storefront and seller form category order (unknown categories sort last, then A–Z). */
export const CATEGORY_DISPLAY_ORDER = [
  'Electronics',
  'Fashion',
  'Beauty',
  'Home',
  'Grocery',
  'Sports',
  'Automotive',
  'Toys',
  'Pets',
  'Books',
] as const

export function sortCategoryNames(names: string[]) {
  const order = new Map(
    CATEGORY_DISPLAY_ORDER.map((name, index) => [name.toLowerCase(), index]),
  )

  return [...names].sort((a, b) => {
    const aIndex = order.get(a.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
    const bIndex = order.get(b.toLowerCase()) ?? Number.MAX_SAFE_INTEGER
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.localeCompare(b)
  })
}

export function getCategoryIconName(categoryName: string) {
  const normalized = categoryName.trim().toLowerCase()
  const direct = CATEGORY_ICONS.find((icon) => normalized.includes(icon))
  if (direct) return direct
  return CATEGORY_ICONS[normalized.length % CATEGORY_ICONS.length]
}

export function getCategorySlug(categoryName: string) {
  return categoryName.toLowerCase().replaceAll(' ', '-')
}

export function getSubcategorySlug(subCategoryName: string) {
  return subCategoryName.toLowerCase().replaceAll(' ', '-')
}

export function resolveNameFromSlug(names: string[], slug: string) {
  return names.find((name) => getCategorySlug(name) === slug)
    ?? names.find((name) => getSubcategorySlug(name) === slug)
    ?? null
}
