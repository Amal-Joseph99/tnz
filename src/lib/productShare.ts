import type { Product } from '../data/products'
import { absoluteUrl } from './site'
import { productSharePagePath } from './sharePages'

export function getProductShareUrl(product: Product): string {
  return absoluteUrl(productSharePagePath(product.id))
}

export async function shareProduct(product: Product): Promise<'shared' | 'copied' | 'cancelled'> {
  const shareUrl = getProductShareUrl(product)
  const shareData = {
    title: product.title,
    text: `Check out ${product.title} on AGTRENZ`,
    url: shareUrl,
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  }

  throw new Error('Sharing is not supported in this browser.')
}
