export type TermsAndConditionsBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

export type TermsAndConditionsSection = {
  title: string
  blocks: TermsAndConditionsBlock[]
}

export const termsAndConditionsLastUpdated = 'June 29, 2026'

export const termsAndConditionsIntro: TermsAndConditionsBlock[] = [
  { kind: 'p', text: '**Last Updated:** June 29, 2026' },
  {
    kind: 'p',
    text: 'Welcome to AGTRENZ ("AGTRENZ", "Platform", "we", "our", or "us"). These Terms and Conditions ("Terms") govern your access to and use of the AGTRENZ website, mobile applications, and related services. By accessing or using the Platform, you agree to be bound by these Terms.',
  },
]

export const termsAndConditionsSections: TermsAndConditionsSection[] = [
  {
    title: '1. About AGTRENZ',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ is an online marketplace that connects Buyers and independent Sellers. AGTRENZ provides technology, payment facilitation, and marketplace services but does not manufacture, own, store, or sell the products listed by Sellers unless expressly stated otherwise.',
      },
    ],
  },
  {
    title: '2. Eligibility',
    blocks: [
      {
        kind: 'p',
        text: 'You must be legally capable of entering into a binding agreement under the laws applicable in your country or region to use AGTRENZ. By creating an account, you confirm that the information you provide is accurate and up to date.',
      },
    ],
  },
  {
    title: '3. User Accounts',
    blocks: [
      {
        kind: 'p',
        text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account. Notify AGTRENZ immediately if you suspect unauthorized access to your account.',
      },
    ],
  },
  {
    title: '4. Orders',
    blocks: [
      {
        kind: 'p',
        text: 'All orders placed through AGTRENZ are subject to Seller acceptance and product availability. Once an order is confirmed, the Seller is responsible for preparing and dispatching the product in accordance with the Platform\'s policies.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ reserves the right to cancel any order where fraud, pricing errors, technical issues, or legal concerns are identified.',
      },
    ],
  },
  {
    title: '5. Pricing and Payments',
    blocks: [
      { kind: 'p', text: 'Product prices are determined solely by Sellers.' },
      {
        kind: 'p',
        text: 'Payments are processed securely through authorized payment service providers. AGTRENZ does not store complete payment card or banking credentials.',
      },
      {
        kind: 'p',
        text: 'Applicable shipping charges, service fees, or other charges will be displayed before checkout where applicable.',
      },
    ],
  },
  {
    title: '6. Taxes',
    blocks: [
      {
        kind: 'p',
        text: 'Sellers are solely responsible for determining and complying with all tax obligations applicable to their products and business activities.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ does not collect, calculate, file, or remit taxes on behalf of Buyers or Sellers unless required by applicable law.',
      },
    ],
  },
  {
    title: '7. Shipping and Delivery',
    blocks: [
      { kind: 'p', text: 'Orders are delivered through independent third-party logistics partners.' },
      {
        kind: 'p',
        text: "Estimated delivery dates are provided for convenience only and are not guaranteed. Delivery times may vary due to weather, customs clearance, carrier delays, public holidays, or other circumstances beyond AGTRENZ's control.",
      },
    ],
  },
  {
    title: '8. Returns and Refunds',
    blocks: [
      {
        kind: 'p',
        text: 'Returns and refunds are governed by the AGTRENZ Return and Refund Policy and applicable consumer protection laws.',
      },
      {
        kind: 'p',
        text: 'Products that arrive damaged, defective, significantly different from their description, or otherwise eligible under the applicable policy may qualify for return or refund.',
      },
    ],
  },
  {
    title: '9. Product Information',
    blocks: [
      {
        kind: 'p',
        text: 'Product descriptions, specifications, images, pricing, warranties, and other listing information are provided by independent Sellers.',
      },
      {
        kind: 'p',
        text: 'While AGTRENZ encourages accurate listings, the Platform does not guarantee the accuracy, completeness, or reliability of Seller-provided information.',
      },
    ],
  },
  {
    title: '10. Prohibited Activities',
    blocks: [
      { kind: 'p', text: 'Users must not:' },
      {
        kind: 'ul',
        items: [
          'Violate any applicable laws or regulations.',
          'Use the Platform for fraudulent purposes.',
          'Attempt unauthorized access to any account or system.',
          'Upload malicious software or harmful content.',
          'Infringe intellectual property rights.',
          'Interfere with the operation or security of the Platform.',
          'Misuse customer or Seller information.',
          "Circumvent the Platform's payment system.",
        ],
      },
    ],
  },
  {
    title: '11. Intellectual Property',
    blocks: [
      {
        kind: 'p',
        text: 'All AGTRENZ trademarks, logos, software, designs, graphics, text, and other Platform content are owned by or licensed to AGTRENZ and are protected by applicable intellectual property laws.',
      },
      {
        kind: 'p',
        text: 'Users may not reproduce, copy, distribute, modify, or commercially exploit Platform content without prior written permission.',
      },
    ],
  },
  {
    title: '12. Third-Party Services',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may integrate third-party services, including payment providers, logistics partners, and other service providers. Their services are governed by their own terms and privacy policies.',
      },
    ],
  },
  {
    title: '13. Limitation of Liability',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ operates solely as an online marketplace connecting Buyers and independent Sellers.',
      },
      { kind: 'p', text: 'Except where liability cannot be excluded by law, AGTRENZ shall not be responsible for:' },
      {
        kind: 'ul',
        items: [
          'Product quality or authenticity.',
          'Manufacturing defects.',
          'Product warranties.',
          'Seller conduct.',
          'Product safety.',
          'Delivery delays caused by Sellers or logistics providers.',
          'Losses arising from transactions between Buyers and Sellers.',
          'Indirect, incidental, special, or consequential damages.',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller remains solely responsible for the products they list and sell through the Platform.',
      },
    ],
  },
  {
    title: '14. Suspension or Termination',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may suspend, restrict, or terminate any account that violates these Terms, applicable laws, or Platform policies, or where fraudulent or abusive activity is suspected.',
      },
    ],
  },
  {
    title: '15. Privacy',
    blocks: [
      {
        kind: 'p',
        text: 'Your use of AGTRENZ is also governed by the AGTRENZ Privacy Policy, which explains how personal information is collected, used, stored, and protected.',
      },
    ],
  },
  {
    title: '16. Changes to These Terms',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may revise these Terms from time to time. Updated versions will be published on the Platform with a revised "Last Updated" date. Continued use of the Platform after such changes constitutes acceptance of the updated Terms.',
      },
    ],
  },
  {
    title: '17. Severability',
    blocks: [
      {
        kind: 'p',
        text: 'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.',
      },
    ],
  },
  {
    title: '18. Entire Agreement',
    blocks: [
      {
        kind: 'p',
        text: 'These Terms, together with the Privacy Policy, Seller Agreement, Return and Refund Policy, Shipping Policy, and other policies published by AGTRENZ, constitute the entire agreement between you and AGTRENZ regarding your use of the Platform.',
      },
    ],
  },
  {
    title: '19. Contact Us',
    blocks: [
      {
        kind: 'p',
        text: 'If you have any questions regarding these Terms and Conditions, please contact AGTRENZ through the official customer support channels available on the Platform.',
      },
    ],
  },
]
