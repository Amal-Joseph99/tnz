export type ReturnAndRefundPolicyBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

export type ReturnAndRefundPolicySection = {
  title: string
  blocks: ReturnAndRefundPolicyBlock[]
}

export const returnAndRefundPolicyIntro: ReturnAndRefundPolicyBlock[] = [
  { kind: 'p', text: '**Last Updated:** June 29, 2026' },
  {
    kind: 'p',
    text: 'At AGTRENZ, we strive to provide a fair and transparent marketplace that protects both Buyers and Sellers. This Return and Refund Policy explains the circumstances under which returns and refunds may be requested.',
  },
]

export const returnAndRefundPolicySections: ReturnAndRefundPolicySection[] = [
  {
    title: '1. Return Eligibility',
    blocks: [
      { kind: 'p', text: 'A Buyer may request a return or refund if the delivered product:' },
      {
        kind: 'ul',
        items: [
          'Arrives damaged during transit.',
          'Is defective or not in proper working condition.',
          'Is significantly different from the product description or images.',
          'Is the wrong item.',
          'Has a size different from the size ordered.',
          'Has a quantity different from the quantity ordered.',
          'Has quality issues that materially differ from the advertised product.',
          'Has missing parts or accessories that were included in the product listing.',
        ],
      },
      {
        kind: 'p',
        text: 'Returns and refunds are subject to verification by AGTRENZ and the Seller.',
      },
    ],
  },
  {
    title: '2. Return Request Time Limit',
    blocks: [
      {
        kind: 'p',
        text: 'To be eligible for a return or refund, the Buyer **must submit a return request within 12 hours of the recorded delivery time**.',
      },
      {
        kind: 'p',
        text: 'This requirement helps ensure that products are inspected promptly upon delivery and allows AGTRENZ and the Seller to verify genuine product issues while the condition of the item remains unchanged.',
      },
      {
        kind: 'p',
        text: 'Return requests submitted after the 12-hour period may not be accepted unless otherwise required by applicable consumer protection laws or approved by AGTRENZ under exceptional circumstances.',
      },
    ],
  },
  {
    title: '3. Condition of Returned Products',
    blocks: [
      { kind: 'p', text: 'Returned products must:' },
      {
        kind: 'ul',
        items: [
          'Be unused except to the extent reasonably necessary to inspect the item.',
          'Be in the same condition as received.',
          'Include all original accessories, tags, manuals, labels, and packaging where applicable.',
          'Not be altered, washed, repaired, damaged, or modified by the Buyer.',
        ],
      },
      { kind: 'p', text: 'Products that do not meet these conditions may not qualify for a refund.' },
    ],
  },
  {
    title: '4. Fair Use of the Return Policy',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ is committed to maintaining a fair marketplace for both Buyers and Sellers.',
      },
      {
        kind: 'p',
        text: 'The return process is intended to resolve genuine issues with products and must not be used as a product rental or temporary usage service.',
      },
      {
        kind: 'p',
        text: 'Returns may be refused where investigation indicates that a product has been intentionally used beyond reasonable inspection, including situations where the item shows signs of extended wear, washing, damage, alteration, or prolonged use before the return request.',
      },
      {
        kind: 'p',
        text: 'For apparel, footwear, accessories, and similar products, Buyers are expected to inspect the product and determine its suitability immediately after delivery. Products returned after being used for personal, commercial, or extended purposes may not be eligible for a refund.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ values the time, effort, and investment of Sellers and manufacturers and expects Buyers to use the return process responsibly and in good faith.',
      },
    ],
  },
  {
    title: '5. Non-Returnable Items',
    blocks: [
      {
        kind: 'p',
        text: 'Unless required by applicable law, the following products may not be eligible for return or refund once delivered and accepted:',
      },
      {
        kind: 'ul',
        items: [
          'Personal care products that have been opened or used.',
          'Cosmetics and beauty products that have been opened.',
          'Perishable goods.',
          'Customized or personalized products.',
          'Digital products or downloadable content.',
          'Gift cards.',
          'Products specifically marked as non-returnable.',
        ],
      },
    ],
  },
  {
    title: '6. Verification Process',
    blocks: [
      { kind: 'p', text: 'To process a return request, Buyers may be required to provide:' },
      {
        kind: 'ul',
        items: [
          'Clear photographs of the product.',
          'Images of the packaging.',
          'Videos showing the issue, where applicable.',
          'A description of the problem.',
          'Any other information reasonably requested by AGTRENZ or the Seller.',
        ],
      },
      {
        kind: 'p',
        text: "Providing false, misleading, or fraudulent information may result in rejection of the claim and appropriate action against the Buyer's account.",
      },
    ],
  },
  {
    title: '7. Refund Process',
    blocks: [
      {
        kind: 'p',
        text: 'Once the returned product has been received and the claim has been verified, the refund, where approved, will be processed using the original payment method or another method determined by AGTRENZ.',
      },
      {
        kind: 'p',
        text: 'Refund processing times may vary depending on the payment provider and financial institution.',
      },
    ],
  },
  {
    title: '8. Seller Responsibility',
    blocks: [
      { kind: 'p', text: 'Sellers are responsible for ensuring that products:' },
      {
        kind: 'ul',
        items: [
          'Match their descriptions.',
          'Meet the advertised quality standards.',
          'Are correctly sized where applicable.',
          'Are securely packaged.',
          'Are free from manufacturing defects.',
          'Are delivered in the correct quantity.',
        ],
      },
      {
        kind: 'p',
        text: "Approved refunds resulting from Seller errors may be deducted from the Seller's payout in accordance with the Seller Agreement.",
      },
    ],
  },
  {
    title: '9. Fraud Prevention',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ reserves the right to reject return or refund requests where there is reasonable evidence of:',
      },
      {
        kind: 'ul',
        items: [
          'Abuse of the return process.',
          'Repeated fraudulent return activity.',
          'Intentional product damage.',
          'Item substitution.',
          'False claims.',
          'Excessive return patterns.',
          'Violation of this Policy.',
        ],
      },
      {
        kind: 'p',
        text: 'Appropriate account restrictions or other actions may be taken where fraudulent activity is identified.',
      },
    ],
  },
  {
    title: '10. Contact Us',
    blocks: [
      {
        kind: 'p',
        text: 'If you require assistance regarding a return or refund, please contact AGTRENZ through the official customer support channels available on the Platform.',
      },
    ],
  },
]
