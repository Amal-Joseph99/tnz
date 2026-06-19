const CATEGORY_ICONS = ['electronics', 'fashion', 'home', 'beauty', 'luggage', 'combo', 'grocery', 'others'] as const

export function getCategoryIconName(categoryName: string) {
  const normalized = categoryName.trim().toLowerCase()
  const direct = CATEGORY_ICONS.find((icon) => normalized.includes(icon))
  if (direct) return direct
  return CATEGORY_ICONS[normalized.length % CATEGORY_ICONS.length]
}

export function getCategorySlug(categoryName: string) {
  return categoryName.toLowerCase().replaceAll(' ', '-')
}
