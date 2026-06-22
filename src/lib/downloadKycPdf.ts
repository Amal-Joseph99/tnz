import type { KycDetail, KycQueueItem } from './adminApprovals'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatDateTime(iso: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function field(label: string, value: string) {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || '—')}</td></tr>`
}

export function downloadKycVerificationPdf(item: KycQueueItem, detail: KycDetail | null) {
  const submission = detail?.submission ?? {}
  const sellerName = item.businessName || item.signupBusinessName || item.sellerEmail || 'Seller'
  const status = item.status.replaceAll('_', ' ').toUpperCase()
  const reviewedLine =
    item.status === 'approved' || item.status === 'rejected'
      ? `<p><strong>Reviewed:</strong> ${escapeHtml(formatDateTime(item.reviewedAt ?? ''))}</p>`
      : ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KYC ${escapeHtml(item.kycId)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
    th { width: 34%; background: #f8fafc; font-weight: 600; }
    .meta { margin-bottom: 16px; }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-weight: 700; }
  </style>
</head>
<body>
  <h1>KYC Verification — ${escapeHtml(sellerName)}</h1>
  <div class="meta">
    <p><strong>KYC ID:</strong> ${escapeHtml(item.kycId)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(formatDateTime(item.submittedAt))}</p>
    <p><strong>Status:</strong> <span class="status">${escapeHtml(status)}</span></p>
    ${reviewedLine}
  </div>
  <h2>Personal details</h2>
  <table>
    ${field('Full name', String(submission.contact_full_name ?? sellerName))}
    ${field('Email', item.sellerEmail || detail?.sellerEmail || '')}
    ${field('Mobile', String(submission.contact_phone ?? item.phone ?? ''))}
    ${field('Country', item.countryName || detail?.countryName || '')}
  </table>
  <h2>Business details</h2>
  <table>
    ${field('Business name', item.businessName)}
    ${field('Business type', item.businessType)}
    ${field('Business address', item.businessAddress)}
    ${field('Tax ID / GST', item.taxId ?? '')}
  </table>
  <h2>Account details</h2>
  <table>
    ${field('Account holder', item.accountHolderName)}
    ${field('Bank name', item.bankName)}
    ${field('Account number', item.accountNumber)}
    ${field('IFSC / SWIFT', item.ifscSwift)}
  </table>
  ${
    item.status === 'rejected' && item.rejectionReason
      ? `<h2>Rejection reason</h2><p>${escapeHtml(item.rejectionReason)}</p>`
      : ''
  }
</body>
</html>`

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
