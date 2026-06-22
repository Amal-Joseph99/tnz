export type LegalSection = {
  title: string
  paragraphs: string[]
}

export type LegalDocument = {
  slug: string
  eyebrow: string
  title: string
  subtitle: string
  sections: LegalSection[]
}

export const legalDocuments: Record<string, LegalDocument> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'How AGTRENZ collects, uses, and protects personal information.',
    sections: [
      { title: 'Information we collect', paragraphs: ['We collect account details, delivery information, order history, payment references, support messages, device data, and marketplace preferences required to operate AGTRENZ.'] },
      { title: 'How we use information', paragraphs: ['We use data to process orders, provide customer and seller support, prevent fraud, improve discovery, comply with law, and send service communications.'] },
      { title: 'Sharing', paragraphs: ['We share data with payment processors (Razorpay), logistics partners (Shiprocket), cloud infrastructure providers, and sellers fulfilling your orders. We do not sell personal data.'] },
      { title: 'Your rights', paragraphs: ['You may access, correct, or delete account data, manage marketing preferences, and contact us for privacy requests at privacy@agtrenz.com.'] },
    ],
  },
  'terms-of-service': {
    slug: 'terms-of-service',
    eyebrow: 'Legal',
    title: 'Terms of Service',
    subtitle: 'Rules for using AGTRENZ as a buyer or seller.',
    sections: [
      { title: 'Marketplace use', paragraphs: ['You must provide accurate information, comply with applicable laws, and not misuse the platform, listings, reviews, or messaging systems.'] },
      { title: 'Orders', paragraphs: ['Product availability, pricing, taxes, shipping estimates, and delivery timelines may vary by seller, destination, and inventory.'] },
      { title: 'Account suspension', paragraphs: ['We may suspend accounts for fraud, policy violations, chargebacks, or conduct that harms buyers, sellers, or the marketplace.'] },
    ],
  },
  'shipping-policy': {
    slug: 'shipping-policy',
    eyebrow: 'Legal',
    title: 'Shipping Policy',
    subtitle: 'Delivery coverage, timelines, and logistics for AGTRENZ orders.',
    sections: [
      { title: 'India-origin fulfillment', paragraphs: ['AGTRENZ marketplace orders ship from India-origin seller warehouses via integrated logistics partners including Shiprocket for domestic and international lanes.'] },
      { title: 'Delivery estimates', paragraphs: ['Estimated delivery dates shown at checkout are provided by the carrier and are not guaranteed. Customs clearance may add time for international orders.'] },
      { title: 'Shipping charges', paragraphs: ['Shipping fees are calculated at checkout based on weight, dimensions, destination, and selected service level.'] },
    ],
  },
  'refund-policy': {
    slug: 'refund-policy',
    eyebrow: 'Legal',
    title: 'Refund & Return Policy',
    subtitle: 'Eligibility, timelines, and refund processing for marketplace orders.',
    sections: [
      { title: 'Return eligibility', paragraphs: ['Returns may be requested after delivery within the return window shown at checkout. Items must be unused and in original packaging unless defective or incorrect.'] },
      { title: 'Refund method', paragraphs: ['Prepaid orders refunded to the original payment method via Razorpay. Cash on delivery orders are refunded via approved alternative methods where applicable.'] },
      { title: 'Processing time', paragraphs: ['Refunds are initiated after return inspection and may take 5–10 business days to appear depending on your bank or card issuer.'] },
    ],
  },
  'cookies-settings': {
    slug: 'cookies-settings',
    eyebrow: 'Legal',
    title: 'Cookie Policy',
    subtitle: 'How AGTRENZ uses cookies and similar technologies.',
    sections: [
      { title: 'Essential cookies', paragraphs: ['Required for authentication, cart persistence, checkout security, and session management.'] },
      { title: 'Analytics cookies', paragraphs: ['Help us understand usage patterns to improve performance and product discovery. You may disable non-essential cookies in your browser.'] },
      { title: 'Managing cookies', paragraphs: ['You can clear or block cookies through browser settings. Some features may not work if essential cookies are disabled.'] },
    ],
  },
  'seller-agreement': {
    slug: 'seller-agreement',
    eyebrow: 'Legal',
    title: 'Seller Agreement',
    subtitle: 'Terms governing sellers on the AGTRENZ marketplace.',
    sections: [
      { title: 'Listing standards', paragraphs: ['Sellers must provide accurate product information, valid HSN codes, truthful images, and maintain adequate inventory.'] },
      { title: 'Fulfillment', paragraphs: ['Sellers must accept or reject orders promptly, ship within stated handling times, and provide valid pickup locations for logistics integration.'] },
      { title: 'Fees & payouts', paragraphs: ['Marketplace commission and settlement schedules are defined in the seller dashboard wallet. Payouts are released after the settlement period following delivery.'] },
    ],
  },
  'buyer-protection': {
    slug: 'buyer-protection',
    eyebrow: 'Legal',
    title: 'Buyer Protection',
    subtitle: 'How AGTRENZ helps protect buyers on every order.',
    sections: [
      { title: 'Secure payments', paragraphs: ['Online payments are processed by Razorpay. We do not store full card numbers on AGTRENZ servers.'] },
      { title: 'Order support', paragraphs: ['If an item is not delivered, is significantly not as described, or arrives damaged, contact support to open a case.'] },
      { title: 'Dispute resolution', paragraphs: ['We review order records, tracking, seller responses, and return evidence to reach a fair outcome.'] },
    ],
  },
  'payment-terms': {
    slug: 'payment-terms',
    eyebrow: 'Legal',
    title: 'Payment Terms',
    subtitle: 'Accepted payment methods, billing, and currency information.',
    sections: [
      { title: 'Accepted methods', paragraphs: ['Razorpay supports cards, UPI, netbanking, and international cards where enabled. India domestic orders may offer cash on delivery where serviceable.'] },
      { title: 'Currency', paragraphs: ['Prices display in your selected marketplace currency. Razorpay charges in the currency shown at checkout.'] },
      { title: 'Failed payments', paragraphs: ['Orders are not confirmed until payment succeeds. Abandoned checkout sessions are automatically cancelled.'] },
    ],
  },
  disclaimer: {
    slug: 'disclaimer',
    eyebrow: 'Legal',
    title: 'Disclaimer',
    subtitle: 'Limitations of liability and marketplace disclaimers.',
    sections: [
      { title: 'Marketplace role', paragraphs: ['AGTRENZ operates as a marketplace platform connecting buyers and independent sellers. Product descriptions are provided by sellers.'] },
      { title: 'No warranty', paragraphs: ['Except where required by law, AGTRENZ disclaims implied warranties regarding products sold by third-party sellers.'] },
      { title: 'Limitation of liability', paragraphs: ['AGTRENZ is not liable for indirect, incidental, or consequential damages arising from use of the platform to the maximum extent permitted by law.'] },
    ],
  },
  accessibility: {
    slug: 'accessibility',
    eyebrow: 'Legal',
    title: 'Accessibility Statement',
    subtitle: 'Our commitment to accessible shopping experiences.',
    sections: [
      { title: 'Our commitment', paragraphs: ['AGTRENZ aims to conform to WCAG 2.1 Level AA guidelines and continuously improve keyboard navigation, contrast, and screen reader support.'] },
      { title: 'Feedback', paragraphs: ['If you encounter accessibility barriers, contact accessibility@agtrenz.com with the page URL and description of the issue.'] },
    ],
  },
}

export const footerLegalLinks = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Refund & Returns', to: '/refund-policy' },
  { label: 'Cookie Policy', to: '/cookies-settings' },
] as const
