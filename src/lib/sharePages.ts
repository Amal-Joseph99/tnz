import type { Product } from '../data/products'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function ogImageUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl)
    if (url.hostname.includes('unsplash.com')) {
      url.searchParams.set('w', '1200')
      url.searchParams.set('h', '630')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('auto', 'format')
      return url.toString()
    }
  } catch {
    // Keep original URL when parsing fails.
  }

  return imageUrl
}

export function productSharePagePath(productId: string): string {
  return `/share/${productId}.html`
}

export function buildProductShareHtml(product: Product, siteOrigin: string): string {
  const productPath = `/product/${product.id}`
  const productUrl = `${siteOrigin}${productPath}`
  const shareUrl = `${siteOrigin}${productSharePagePath(product.id)}`
  const imageUrl = ogImageUrl(product.image)
  const title = `${product.title} | AGTRENZ`
  const description = `${product.title} by ${product.brand}. Shop on AGTRENZ.`

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(productUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="AGTRENZ" />
    <meta property="og:title" content="${escapeHtml(product.title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(product.title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(productPath)}" />
    <script>window.location.replace(${JSON.stringify(productPath)});</script>
  </head>
  <body>
    <p>Opening product… <a href="${escapeHtml(productPath)}">Continue</a></p>
  </body>
</html>
`
}