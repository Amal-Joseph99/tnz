import { useEffect, useState } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PortalHelpSection } from '../components/PortalHelpSection'
import { fetchHelpPortalContent } from '../lib/helpCenter'

export function SellerHelpPage() {
  const [title, setTitle] = useState('Help')
  const [subtitle, setSubtitle] = useState('Get seller support for orders, listings, payouts, and account issues.')

  useEffect(() => {
    void fetchHelpPortalContent('seller').then((content) => {
      if (content.portal) {
        setTitle(content.portal.title)
        setSubtitle(content.portal.subtitle)
      }
    })
  }, [])

  return (
    <SellerDashboardShell title={title} subtitle={subtitle}>
      <PortalHelpSection portalKey="seller" />
    </SellerDashboardShell>
  )
}
