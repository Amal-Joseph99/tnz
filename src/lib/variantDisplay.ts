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
