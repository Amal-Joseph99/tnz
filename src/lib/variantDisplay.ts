export function formatVariantSize(size: string) {
  const normalized = size.trim()
  if (/^free\s*size$/i.test(normalized)) {
    return 'Free Size'
  }
  return normalized
}

export function formatVariantColor(color: string) {
  const normalized = color.trim()
  if (/^no\s*color$/i.test(normalized)) {
    return 'Generic'
  }
  return normalized
}

export function formatOrderItemVariantLabel(item: {
  variant_size?: string | null
  variant_color?: string | null
  variantSize?: string | null
  variantColor?: string | null
}) {
  const size = item.variant_size ?? item.variantSize
  const color = item.variant_color ?? item.variantColor
  const parts = [
    size ? formatVariantSize(size) : '',
    color ? formatVariantColor(color) : '',
  ].filter(Boolean)
  return parts.join(' · ')
}
