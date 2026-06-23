const SCROLL_ROOT_SELECTORS = [
  '.admin-console__scroll',
  '.app-main',
] as const

export function scrollPageToTop() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  for (const selector of SCROLL_ROOT_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLElement) {
        node.scrollTop = 0
      }
    })
  }
}

export function initScrollRestoration() {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
}
