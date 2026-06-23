import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollPageToTop } from '../lib/scrollToTop'

export function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    scrollPageToTop()

    const frame = window.requestAnimationFrame(() => {
      scrollPageToTop()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname, location.search, location.key])

  return null
}
