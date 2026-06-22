import { useEffect } from 'react'
import { SellerDashboardShell } from '../components/SellerDashboardShell'
import { PortalHelpSection } from '../components/PortalHelpSection'
import { fetchHelpPortalContent } from '../lib/helpCenter'

export function SellerHelpPage() {
  useEffect(() => {
    void fetchHelpPortalContent('seller')
  }, [])

  return (
    <SellerDashboardShell>
      <PortalHelpSection portalKey="seller" />
    </SellerDashboardShell>
  )
}
