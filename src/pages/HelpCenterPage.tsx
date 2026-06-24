import { useEffect, useState } from 'react'
import { PageShell } from '../components/PageShell'
import { BuyerHelpSection } from '../components/BuyerHelpSection'
import { fetchHelpPortalContent } from '../lib/helpCenter'

export function HelpCenterPage() {
  const [title, setTitle] = useState('Help Center')
  const [subtitle, setSubtitle] = useState('Find answers about shopping, payments, orders, returns, and account support.')

  useEffect(() => {
    void fetchHelpPortalContent('buyer').then((content) => {
      if (content.portal) {
        setTitle(content.portal.title)
        setSubtitle(content.portal.subtitle)
      }
    })
  }, [])

  return (
    <PageShell eyebrow="Support" title={title} subtitle={subtitle}>
      <BuyerHelpSection />
    </PageShell>
  )
}
