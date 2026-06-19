import { useEffect } from 'react'

type PageMetaProps = {
  title: string
  description?: string
  image?: string
  url?: string
  type?: string
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

export function PageMeta({ title, description, image, url, type = 'website' }: PageMetaProps) {
  useEffect(() => {
    document.title = title

    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }

    upsertMeta('property', 'og:title', title)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('property', 'og:type', type)

    if (url) {
      upsertMeta('property', 'og:url', url)
    }

    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('property', 'og:image:secure_url', image)
      upsertMeta('name', 'twitter:image', image)
      upsertMeta('name', 'twitter:card', 'summary_large_image')
    }
  }, [description, image, title, type, url])

  return null
}
