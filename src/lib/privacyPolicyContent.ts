export type PrivacyPolicyBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

export type PrivacyPolicySection = {
  title: string
  blocks: PrivacyPolicyBlock[]
}

export const privacyPolicyLastUpdated = 'June 29, 2026'

export const privacyPolicyIntro: PrivacyPolicyBlock[] = [
  { kind: 'p', text: '**Last Updated:** June 29, 2026' },
  {
    kind: 'p',
    text: 'Welcome to AGTRENZ ("Platform", "we", "our", or "us"). Your privacy is important to us. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use AGTRENZ\'s website, mobile applications, and related services.',
  },
  {
    kind: 'p',
    text: 'By using AGTRENZ, you agree to the practices described in this Privacy Policy.',
  },
]

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: '1. Information We Collect',
    blocks: [
      { kind: 'p', text: 'We may collect the following information when you use our Platform:' },
      {
        kind: 'ul',
        items: [
          'Full name',
          'Email address',
          'Mobile number',
          'Billing address',
          'Shipping address',
          'Payment-related information (processed securely by our payment partners)',
          'Account login information',
          'Order history',
          'Wishlist and shopping preferences',
          'Device information',
          'Browser information',
          'IP address',
          'Location information (where permitted)',
          'Cookies and similar technologies',
        ],
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    blocks: [
      { kind: 'p', text: 'Your information may be used to:' },
      {
        kind: 'ul',
        items: [
          'Create and manage your account',
          'Process orders and payments',
          'Deliver products through our shipping partners',
          'Communicate order updates',
          'Respond to customer support requests',
          'Prevent fraud and unauthorized activities',
          'Improve our Platform and services',
          'Personalize your shopping experience',
          'Send important service notifications',
          'Comply with legal and regulatory requirements',
        ],
      },
    ],
  },
  {
    title: '3. Payment Information',
    blocks: [
      { kind: 'p', text: 'Payments are processed through secure third-party payment providers.' },
      {
        kind: 'p',
        text: 'AGTRENZ does not store your complete debit card, credit card, or banking credentials on its own servers.',
      },
      {
        kind: 'p',
        text: 'Payment providers handle financial information in accordance with their own privacy and security standards.',
      },
    ],
  },
  {
    title: '4. Sharing Your Information',
    blocks: [
      { kind: 'p', text: 'We only share your information where necessary to provide our services.' },
      { kind: 'p', text: 'Your information may be shared with:' },
      {
        kind: 'ul',
        items: [
          'Sellers fulfilling your order',
          'Shipping and logistics partners',
          'Payment service providers',
          'Customer support providers',
          'Government or regulatory authorities when legally required',
          'Fraud prevention and security partners',
        ],
      },
      { kind: 'p', text: 'We do not sell your personal information to third parties.' },
    ],
  },
  {
    title: "5. Sellers' Access to Information",
    blocks: [
      {
        kind: 'p',
        text: 'When you place an order, the Seller receives only the information necessary to fulfil your purchase, including your name, shipping address, contact details, and order information.',
      },
      {
        kind: 'p',
        text: 'Sellers are required to use this information solely for order fulfilment and customer support and must not use it for unauthorized marketing or disclose it to third parties.',
      },
    ],
  },
  {
    title: '6. Cookies',
    blocks: [
      { kind: 'p', text: 'AGTRENZ uses cookies and similar technologies to:' },
      {
        kind: 'ul',
        items: [
          'Keep you signed in',
          'Remember your preferences',
          'Improve website performance',
          'Analyze traffic',
          'Enhance security',
          'Personalize content',
        ],
      },
      { kind: 'p', text: 'You may manage cookie preferences through your browser settings.' },
    ],
  },
  {
    title: '7. Data Security',
    blocks: [
      {
        kind: 'p',
        text: 'We implement reasonable administrative, technical, and organizational measures to help protect your personal information against unauthorized access, disclosure, alteration, or destruction.',
      },
      {
        kind: 'p',
        text: 'While we strive to safeguard your information, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.',
      },
    ],
  },
  {
    title: '8. Data Retention',
    blocks: [
      { kind: 'p', text: 'We retain your information only for as long as necessary to:' },
      {
        kind: 'ul',
        items: [
          'Maintain your account',
          'Complete transactions',
          'Provide customer support',
          'Meet legal, accounting, tax, and regulatory obligations',
          'Resolve disputes',
          'Enforce our agreements',
        ],
      },
    ],
  },
  {
    title: '9. Your Rights',
    blocks: [
      { kind: 'p', text: 'Subject to applicable laws, you may have the right to:' },
      {
        kind: 'ul',
        items: [
          'Access your personal information',
          'Correct inaccurate information',
          'Update your account details',
          'Request deletion of your account or personal data',
          'Object to certain processing activities',
          'Withdraw consent where applicable',
        ],
      },
      {
        kind: 'p',
        text: 'Some information may be retained where required by law or for legitimate business purposes.',
      },
    ],
  },
  {
    title: '10. Third-Party Services',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may contain links to third-party websites or integrate third-party services, including payment providers and logistics partners.',
      },
      {
        kind: 'p',
        text: 'We are not responsible for the privacy practices or content of those third parties.',
      },
    ],
  },
  {
    title: "11. Children's Privacy",
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ is not intended for individuals under the age required by applicable law to enter into a binding agreement. We do not knowingly collect personal information from children.',
      },
    ],
  },
  {
    title: '12. International Data Processing',
    blocks: [
      {
        kind: 'p',
        text: 'Your information may be processed or stored in countries where AGTRENZ or its service providers operate. We take reasonable steps to protect personal information in accordance with applicable privacy laws.',
      },
    ],
  },
  {
    title: '13. Changes to This Privacy Policy',
    blocks: [
      {
        kind: 'p',
        text: 'We may update this Privacy Policy from time to time. Updated versions will be published on the Platform with a revised "Last Updated" date. Continued use of AGTRENZ after any changes constitutes acceptance of the updated Privacy Policy.',
      },
    ],
  },
  {
    title: '14. Contact Us',
    blocks: [
      {
        kind: 'p',
        text: 'If you have any questions about this Privacy Policy or your personal information, please contact AGTRENZ through the official support channels available on the Platform.',
      },
    ],
  },
]
