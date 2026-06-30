export type CookiePolicyBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'h3'; text: string }

export type CookiePolicySection = {
  title: string
  blocks: CookiePolicyBlock[]
}

export const cookiePolicyIntro: CookiePolicyBlock[] = [
  { kind: 'p', text: '**Last Updated:** June 29, 2026' },
  {
    kind: 'p',
    text: 'This Cookie Policy explains how AGTRENZ ("Platform", "we", "our", or "us") uses cookies and similar technologies when you visit or use our website, mobile applications, and related services.',
  },
  {
    kind: 'p',
    text: 'By continuing to use AGTRENZ, you consent to the use of cookies as described in this Policy, unless you disable them through your browser or device settings.',
  },
]

export const cookiePolicySections: CookiePolicySection[] = [
  {
    title: '1. What Are Cookies?',
    blocks: [
      {
        kind: 'p',
        text: 'Cookies are small text files stored on your device when you visit a website. They help websites function properly, remember your preferences, improve security, and provide a better browsing experience.',
      },
      {
        kind: 'p',
        text: 'Some cookies are temporary and expire when you close your browser, while others remain on your device until they expire or are deleted.',
      },
    ],
  },
  {
    title: '2. Why We Use Cookies',
    blocks: [
      { kind: 'p', text: 'AGTRENZ uses cookies to:' },
      {
        kind: 'ul',
        items: [
          'Keep you signed in to your account.',
          'Remember your preferences and settings.',
          'Process shopping cart and checkout activities.',
          'Improve website performance and speed.',
          'Provide a personalized shopping experience.',
          'Understand how visitors use the Platform.',
          'Detect and prevent fraudulent or unauthorized activity.',
          'Improve security and system reliability.',
          'Measure website traffic and performance.',
          'Support customer service and troubleshooting.',
        ],
      },
    ],
  },
  {
    title: '3. Types of Cookies We Use',
    blocks: [
      { kind: 'h3', text: 'Essential Cookies' },
      {
        kind: 'p',
        text: 'These cookies are necessary for the Platform to function properly. They enable core features such as account login, shopping cart functionality, checkout, security, and order processing.',
      },
      {
        kind: 'p',
        text: 'These cookies cannot be disabled through the Platform because they are required for essential services.',
      },
      { kind: 'h3', text: 'Performance and Analytics Cookies' },
      {
        kind: 'p',
        text: 'These cookies help us understand how visitors use AGTRENZ by collecting anonymous information about website usage, page visits, navigation patterns, and performance.',
      },
      { kind: 'p', text: 'This information helps us improve the Platform and user experience.' },
      { kind: 'h3', text: 'Functional Cookies' },
      {
        kind: 'p',
        text: 'These cookies remember your preferences, including language, region, recently viewed products, and other settings to provide a more personalized experience.',
      },
      { kind: 'h3', text: 'Security Cookies' },
      {
        kind: 'p',
        text: 'Security cookies help protect your account and the Platform by detecting suspicious activity, preventing fraud, and maintaining secure sessions.',
      },
    ],
  },
  {
    title: '4. Third-Party Cookies',
    blocks: [
      { kind: 'p', text: 'Some services integrated with AGTRENZ may place cookies on your device, including:' },
      {
        kind: 'ul',
        items: [
          'Payment service providers',
          'Analytics providers',
          'Advertising partners (where applicable)',
          'Shipping and logistics integrations',
          'Customer support services',
        ],
      },
      {
        kind: 'p',
        text: 'These third parties operate under their own privacy and cookie policies, and AGTRENZ is not responsible for their practices.',
      },
    ],
  },
  {
    title: '5. Managing Cookies',
    blocks: [
      { kind: 'p', text: 'Most web browsers allow you to:' },
      {
        kind: 'ul',
        items: [
          'View stored cookies.',
          'Delete existing cookies.',
          'Block all cookies.',
          'Block cookies from specific websites.',
          'Receive notifications before cookies are stored.',
        ],
      },
      {
        kind: 'p',
        text: 'Please note that disabling certain cookies may affect the functionality of AGTRENZ, including account access, shopping cart features, checkout, and other services.',
      },
    ],
  },
  {
    title: '6. Advertising Cookies',
    blocks: [
      {
        kind: 'p',
        text: 'Where applicable, AGTRENZ or its advertising partners may use cookies to display more relevant advertisements and measure the effectiveness of advertising campaigns.',
      },
      {
        kind: 'p',
        text: 'These cookies do not provide advertisers with access to your personal account information stored on AGTRENZ.',
      },
    ],
  },
  {
    title: '7. Updates to This Cookie Policy',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or Platform services.',
      },
      {
        kind: 'p',
        text: 'The updated version will be published on the Platform with a revised "Last Updated" date. Continued use of AGTRENZ after any changes constitutes acceptance of the updated Policy.',
      },
    ],
  },
  {
    title: '8. Contact Us',
    blocks: [
      {
        kind: 'p',
        text: 'If you have any questions about this Cookie Policy or the use of cookies on AGTRENZ, please contact us through the official customer support channels available on the Platform.',
      },
    ],
  },
]
