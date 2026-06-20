import { useEffect, useState } from 'react'
import { AdminDashboardShell } from '../components/AdminDashboardShell'
import { PortalHelpSection } from '../components/PortalHelpSection'
import { fetchHelpPortalContent } from '../lib/helpCenter'

export function AdminHelpPage() {
  const [title, setTitle] = useState('Help')
  const [subtitle, setSubtitle] = useState('Platform operations, approvals, compliance, and console guidance.')

  useEffect(() => {
    void fetchHelpPortalContent('admin').then((content) => {
      if (content.portal) {
        setTitle(content.portal.title)
        setSubtitle(content.portal.subtitle)
      }
    })
  }, [])

  return (
    <AdminDashboardShell title={title} subtitle={subtitle}>
      <PortalHelpSection portalKey="admin" />
    </AdminDashboardShell>
  )
}
