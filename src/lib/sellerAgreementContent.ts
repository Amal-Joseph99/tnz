export type SellerAgreementBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

export type SellerAgreementSection = {
  title: string
  blocks: SellerAgreementBlock[]
}

export const sellerAgreementIntro: SellerAgreementBlock[] = [
  {
    kind: 'p',
    text: 'This Seller Agreement ("Agreement") is entered into between **AGTRENZ** ("Platform") and the individual, company, partnership, sole proprietor, or other legal entity registering as a Seller ("Seller").',
  },
  {
    kind: 'p',
    text: 'By creating a Seller account, listing products, accepting orders, or using any Seller services provided by AGTRENZ, the Seller confirms that they have read, understood, and agreed to be legally bound by this Agreement, together with all marketplace policies, operational guidelines, shipping policies, return policies, privacy policies, and any future updates published by the Platform.',
  },
  {
    kind: 'p',
    text: 'AGTRENZ operates solely as an online technology marketplace that enables independent Sellers to offer products directly to Buyers. AGTRENZ provides marketplace infrastructure, payment facilitation, seller tools, order management systems, and logistics coordination services through independent third-party shipping partners.',
  },
  {
    kind: 'p',
    text: 'AGTRENZ does not manufacture, import, export, distribute, warehouse, inspect, certify, endorse, own, or sell the products listed by Sellers. Every product listed on the Platform remains the sole responsibility of the respective Seller.',
  },
]

export const sellerAgreementSections: SellerAgreementSection[] = [
  {
    title: '1. Platform Services',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ provides an online marketplace that allows independent Sellers to market and sell products to customers located in supported countries.',
      },
      { kind: 'p', text: 'The Platform provides services including but not limited to:' },
      {
        kind: 'ul',
        items: [
          'Seller account management',
          'Product listing tools',
          'Marketplace visibility',
          'Product catalogue management',
          'Order management',
          'Payment processing support',
          'Customer order notifications',
          'Shipping partner integration',
          'Seller dashboard',
          'Business analytics',
          'Promotional tools',
          'Customer communication tools where available',
        ],
      },
      { kind: 'p', text: 'The Platform only facilitates transactions between Buyers and Sellers.' },
      {
        kind: 'p',
        text: 'AGTRENZ is not a buyer, reseller, distributor, wholesaler, retailer, or owner of products sold through the marketplace.',
      },
      { kind: 'p', text: 'Every purchase contract is formed directly between the Buyer and the Seller.' },
    ],
  },
  {
    title: '2. Seller Eligibility',
    blocks: [
      {
        kind: 'p',
        text: 'To register as a Seller, the applicant must provide complete, accurate, and truthful information.',
      },
      { kind: 'p', text: 'The Seller shall provide, where applicable:' },
      {
        kind: 'ul',
        items: [
          'Legal name',
          'Business name',
          'Business registration documents',
          'Government-issued identification',
          'Business address',
          'Contact information',
          'Valid email address',
          'Mobile number',
          'Bank account details',
          'Tax registration details where required',
          'Any additional verification documents requested by AGTRENZ',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller confirms that all submitted information is accurate and shall promptly update any changes.',
      },
      {
        kind: 'p',
        text: 'Providing false, misleading, incomplete, expired, or fraudulent information may result in immediate account suspension or permanent termination.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ reserves the unrestricted right to approve, reject, suspend, restrict, verify, or permanently remove any Seller account without liability whenever necessary for security, fraud prevention, legal compliance, operational requirements, or marketplace integrity.',
      },
    ],
  },
  {
    title: '3. Product Listings',
    blocks: [
      { kind: 'p', text: 'The Seller is solely responsible for every product published on AGTRENZ.' },
      { kind: 'p', text: 'Each product listing must:' },
      {
        kind: 'ul',
        items: [
          'Be legally permitted for sale',
          'Comply with all applicable local and international laws',
          'Include accurate product names',
          'Include truthful descriptions',
          'Display genuine product photographs',
          'Contain accurate specifications',
          'State the correct brand',
          'Mention warranty information where applicable',
          'Mention expiry dates where applicable',
          'Mention ingredients where required',
          'Include safety information where applicable',
          'Display correct pricing',
          'Contain accurate package weight',
          'Contain accurate package dimensions',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller shall ensure that all listings remain accurate throughout the listing period.',
      },
      {
        kind: 'p',
        text: 'Products that are prohibited, counterfeit, unsafe, illegal, misleading, expired, recalled, stolen, or infringing intellectual property rights are strictly prohibited.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ reserves the right to edit, restrict, suspend, reject, hide, or permanently remove any listing that violates Platform policies or applicable laws.',
      },
      {
        kind: 'p',
        text: 'Listing approval by AGTRENZ does not constitute certification, inspection, endorsement, or acceptance of responsibility for the listed product.',
      },
    ],
  },
  {
    title: '4. Orders, Packaging and Shipping',
    blocks: [
      {
        kind: 'p',
        text: 'When a Buyer successfully places an order, the order details will be transmitted to the Seller through the AGTRENZ marketplace.',
      },
      { kind: 'p', text: 'The Seller shall:' },
      {
        kind: 'ul',
        items: [
          'Accept and process the order promptly.',
          'Prepare the ordered products within the required handling time.',
          'Pack every product safely and professionally.',
          'Ensure that every shipment complies with shipping requirements.',
          'Keep products ready for collection by the shipping partner assigned through AGTRENZ.',
        ],
      },
      {
        kind: 'p',
        text: 'AGTRENZ partners with independent third-party logistics and courier companies in different countries to facilitate the transportation of Seller orders.',
      },
      {
        kind: 'p',
        text: "The shipping partner's responsibility begins only after collecting the packaged shipment from the Seller.",
      },
      { kind: 'p', text: 'Before collection, the Seller remains fully responsible for the order.' },
      { kind: 'p', text: 'The Seller is solely responsible for:' },
      {
        kind: 'ul',
        items: [
          'Product quality',
          'Packaging quality',
          'Proper sealing',
          'Safe packing',
          'Correct labeling',
          'Shipping compliance',
          'Inventory availability',
          'Accurate package weight',
          'Accurate package dimensions',
          'Shipment readiness',
        ],
      },
      {
        kind: 'p',
        text: 'The package weight and dimensions entered while creating the product listing must accurately represent the final packed shipment.',
      },
      {
        kind: 'p',
        text: 'The Seller acknowledges that shipping charges are calculated using the declared package weight and dimensions.',
      },
      {
        kind: 'p',
        text: 'If the actual packed shipment exceeds the declared weight or dimensions, resulting in additional shipping charges, volumetric charges, courier penalties, surcharge fees, customs adjustments, or logistics costs, all such additional charges shall be borne exclusively by the Seller.',
      },
      {
        kind: 'p',
        text: "AGTRENZ reserves the right to deduct these charges from the Seller's current payout or future earnings without prior approval.",
      },
      {
        kind: 'p',
        text: 'The Seller must ensure that products are packed in accordance with the requirements of the selected shipping partner.',
      },
      { kind: 'p', text: 'Fragile products shall be protected with appropriate cushioning materials.' },
      { kind: 'p', text: 'Liquid products shall be completely sealed to prevent leakage.' },
      { kind: 'p', text: 'Glass products shall be securely protected against breakage.' },
      { kind: 'p', text: 'Hazardous materials must comply with all transportation regulations.' },
      {
        kind: 'p',
        text: 'Improper packaging resulting in product damage, leakage, contamination, customer injury, rejected deliveries, customs issues, or courier penalties shall remain entirely the responsibility of the Seller.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ does not inspect, package, repack, modify, store, or handle Seller products before shipment.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ only facilitates shipping coordination through independent logistics providers.',
      },
      {
        kind: 'p',
        text: 'Except where damage is proven to have been caused solely during transportation by the shipping carrier under its applicable shipping terms, every risk associated with the product, packaging, compliance, and shipment remains solely with the Seller.',
      },
    ],
  },
  {
    title: '5. Marketplace Service Fee',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ operates solely as a marketplace service provider and does not purchase, resell, or own products listed by Sellers.',
      },
      {
        kind: 'p',
        text: 'For every successfully completed order, AGTRENZ charges a **7% Marketplace Service Fee**, calculated on the final product selling price excluding any shipping charges unless otherwise specified by the Platform.',
      },
      {
        kind: 'p',
        text: "The Marketplace Service Fee is automatically deducted from the Seller's payout before funds are released.",
      },
      {
        kind: 'p',
        text: 'The remaining balance, after applicable deductions, refunds, chargebacks, adjustments, shipping corrections, penalties, or other authorized deductions under this Agreement, will be transferred to the Seller.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ reserves the right to revise its Marketplace Service Fee or introduce additional optional service fees by providing reasonable notice through the Seller Dashboard or other official Platform communication channels.',
      },
    ],
  },
  {
    title: '6. Seller Payouts',
    blocks: [
      { kind: 'p', text: 'Seller payouts are processed after successful order completion.' },
      {
        kind: 'p',
        text: 'Subject to this Agreement, payouts will normally be released **within nine (9) days after the order is placed or after successful delivery to the Buyer, whichever occurs later.**',
      },
      { kind: 'p', text: 'Before releasing any payout, AGTRENZ may verify:' },
      {
        kind: 'ul',
        items: [
          'Successful delivery',
          'Fraud indicators',
          'Return requests',
          'Refund requests',
          'Chargebacks',
          'Shipping disputes',
          'Compliance reviews',
          'Identity verification',
          'Regulatory requirements',
        ],
      },
      {
        kind: 'p',
        text: 'AGTRENZ may temporarily hold, delay, adjust, offset, or withhold Seller payouts where reasonably necessary, including but not limited to:',
      },
      {
        kind: 'ul',
        items: [
          'Fraud prevention',
          'Security investigations',
          'Customer disputes',
          'Product quality investigations',
          'Policy violations',
          'Incorrect shipping information',
          'Customs issues',
          'Chargebacks',
          'Court orders',
          'Government requests',
          'Regulatory compliance',
        ],
      },
      {
        kind: 'p',
        text: "Additional courier charges caused by inaccurate package weight, dimensions, prohibited goods, customs declarations, or Seller errors may be deducted from the Seller's payout without prior approval.",
      },
    ],
  },
  {
    title: '7. Tax Responsibilities',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller is solely responsible for understanding and complying with all tax laws applicable to their business.',
      },
      {
        kind: 'p',
        text: 'The Seller shall independently determine, calculate, collect, report, file, and pay all applicable taxes arising from their sales.',
      },
      { kind: 'p', text: 'These may include, but are not limited to:' },
      {
        kind: 'ul',
        items: [
          'Goods and Services Tax (GST)',
          'Value Added Tax (VAT)',
          'Sales Tax',
          'Import Duties',
          'Export Duties',
          'Customs Duties',
          'Income Tax',
          'Corporate Tax',
          'Withholding Tax',
          'Local Government Taxes',
          'Environmental Taxes',
          'Digital Service Taxes',
          'Any other applicable national, regional, state, provincial, or local taxes',
        ],
      },
      {
        kind: 'p',
        text: 'Unless otherwise required by applicable law, the selling price displayed by the Seller shall be deemed to include all taxes payable by the Seller.',
      },
      {
        kind: 'p',
        text: "The Seller shall not hold AGTRENZ responsible for any tax calculation, filing, payment, assessment, audit, penalty, interest, or legal consequences arising from the Seller's business.",
      },
      {
        kind: 'p',
        text: '**AGTRENZ does not collect, calculate, withhold, report, remit, or pay taxes on behalf of Sellers or Buyers.**',
      },
      { kind: 'p', text: 'AGTRENZ is **not**:' },
      {
        kind: 'ul',
        items: [
          'A tax authority',
          'A tax collection agency',
          'A tax consultant',
          'A tax filing service',
          'An accounting firm',
        ],
      },
      { kind: 'p', text: "The Platform's revenue consists solely of its Marketplace Service Fee." },
      {
        kind: 'p',
        text: 'Any tax liabilities arising from transactions conducted through the Platform remain exclusively between the Buyer, the Seller, and the relevant tax authorities.',
      },
      {
        kind: 'p',
        text: "The Seller agrees to indemnify and hold AGTRENZ harmless against any tax claims, liabilities, penalties, assessments, audits, or legal proceedings arising from the Seller's failure to comply with applicable tax laws.",
      },
    ],
  },
  {
    title: '8. Returns, Refunds and Damaged Products',
    blocks: [
      { kind: 'p', text: 'Customer trust is fundamental to the AGTRENZ marketplace.' },
      {
        kind: 'p',
        text: "The Seller agrees to comply with all applicable consumer protection laws together with AGTRENZ's Return and Refund Policy.",
      },
      {
        kind: 'p',
        text: 'Returns and refunds shall be accepted whenever required under applicable law or Platform policy.',
      },
      { kind: 'p', text: 'Refunds may be approved, including but not limited to, where:' },
      {
        kind: 'ul',
        items: [
          'The product arrives damaged.',
          'The product is defective.',
          'The wrong product is delivered.',
          'Essential parts are missing.',
          'The product significantly differs from its description.',
          'The product is counterfeit.',
          'The product is unsafe.',
          'The product is expired.',
          'Improper Seller packaging causes transit damage.',
          'The product becomes unusable due to leakage or breakage.',
        ],
      },
      {
        kind: 'p',
        text: 'Products containing liquids, chemicals, cosmetics, food items, fragile goods, electronics, batteries, medical products, or hazardous materials must be packed using industry-standard protective packaging appropriate for transportation.',
      },
      {
        kind: 'p',
        text: 'If damage occurs because of poor packaging, improper sealing, incorrect labeling, inadequate protection, or Seller negligence, the Seller shall bear full responsibility.',
      },
      {
        kind: 'p',
        text: "Where a refund is approved, AGTRENZ may deduct the refund amount, return shipping costs, chargeback fees, logistics costs, or other associated expenses from the Seller's available balance or future payouts.",
      },
      {
        kind: 'p',
        text: 'The Seller agrees to cooperate fully with all return investigations by providing requested documentation, photographs, invoices, shipping records, or other evidence within the timeframe specified by AGTRENZ.',
      },
      {
        kind: 'p',
        text: 'Failure to cooperate may result in refunds being approved based solely on available evidence.',
      },
    ],
  },
  {
    title: '9. Product Quality, Warranty and Safety',
    blocks: [
      { kind: 'p', text: 'The Seller guarantees that every product listed for sale through AGTRENZ:' },
      {
        kind: 'ul',
        items: [
          'Is genuine and authentic.',
          'Is legally permitted for sale.',
          'Matches the published description.',
          'Matches the advertised specifications.',
          'Meets applicable quality standards.',
          'Complies with all applicable safety regulations.',
          'Is free from undisclosed defects.',
          'Includes accurate warranty information where applicable.',
        ],
      },
      { kind: 'p', text: 'The Seller remains solely responsible for:' },
      {
        kind: 'ul',
        items: [
          'Product quality',
          'Product performance',
          'Product safety',
          'Manufacturing defects',
          'Product recalls',
          'Warranty obligations',
          'Repairs',
          'Replacements',
          'Spare parts',
          'Customer warranty claims',
          'Regulatory approvals',
          'Product certifications',
          'Compliance with applicable laws',
        ],
      },
      {
        kind: 'p',
        text: 'Any warranty offered on a product is provided exclusively by the Seller or the product manufacturer.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ does not provide manufacturer warranties, product guarantees, repair services, replacement services, or product certifications.',
      },
      { kind: 'p', text: 'If any product sold through the Platform causes:' },
      {
        kind: 'ul',
        items: [
          'Physical injury',
          'Illness',
          'Health complications',
          'Allergic reactions',
          'Death',
          'Property damage',
          'Financial loss',
          'Business interruption',
          'Regulatory penalties',
          'Consumer claims',
          'Product liability claims',
          'Environmental damage',
          'Any other direct or indirect loss',
        ],
      },
      { kind: 'p', text: 'the Seller shall bear full legal and financial responsibility.' },
      {
        kind: 'p',
        text: 'Although AGTRENZ may assist communication between Buyers and Sellers, AGTRENZ shall not provide settlements, compensation, reimbursements, damages, insurance coverage, or legal representation relating to such claims.',
      },
      {
        kind: 'p',
        text: "The Seller acknowledges that AGTRENZ is solely a technology marketplace and is **not** the manufacturer, importer, exporter, distributor, retailer, supplier, owner, or authorized representative of the Seller's products.",
      },
      {
        kind: 'p',
        text: 'All disputes relating to product quality, product safety, warranties, defects, regulatory compliance, product liability, or customer damages shall remain the sole responsibility of the Seller.',
      },
    ],
  },
  {
    title: '10. Customer Support',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller shall provide timely, accurate, and professional customer support for all products sold through AGTRENZ.',
      },
      { kind: 'p', text: 'The Seller is responsible for responding to customer enquiries relating to:' },
      {
        kind: 'ul',
        items: [
          'Product information',
          'Product specifications',
          'Order status',
          'Shipping updates',
          'Installation guidance, where applicable',
          'Warranty claims',
          'Returns',
          'Refunds',
          'Product defects',
          'Missing items',
          'Replacement requests',
          'After-sales support',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller shall communicate with Buyers in a respectful, lawful, and professional manner.',
      },
      {
        kind: 'p',
        text: 'Failure to provide reasonable customer support may result in warnings, temporary restrictions, suspension, withheld payouts, or permanent removal from the Platform.',
      },
    ],
  },
  {
    title: '11. Seller Responsibilities and Conduct',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller agrees to operate honestly, fairly, and in compliance with all applicable laws and Platform policies.',
      },
      { kind: 'p', text: 'The Seller shall not:' },
      {
        kind: 'ul',
        items: [
          'Sell counterfeit products.',
          'Sell stolen products.',
          'Sell prohibited or restricted goods.',
          'Sell expired products.',
          'Sell recalled products.',
          'Sell unsafe products.',
          'Publish false or misleading product information.',
          'Manipulate product prices deceptively.',
          'Manipulate ratings or reviews.',
          'Create fake customer accounts.',
          "Circumvent the Platform's payment system.",
          'Request direct payments outside AGTRENZ.',
          'Misuse customer information.',
          'Engage in fraudulent activities.',
          'Abuse Platform services.',
          'Upload malicious software or harmful content.',
          'Infringe intellectual property rights.',
          'Violate consumer protection laws.',
          'Attempt to interfere with Platform operations.',
        ],
      },
      { kind: 'p', text: 'The Seller shall immediately notify AGTRENZ if they become aware of:' },
      {
        kind: 'ul',
        items: [
          'Counterfeit products.',
          'Unauthorized account access.',
          'Product safety risks.',
          'Regulatory investigations.',
          'Significant customer complaints.',
          'Security incidents.',
        ],
      },
      { kind: 'p', text: 'Violation of this Agreement may result in:' },
      {
        kind: 'ul',
        items: [
          'Product removal.',
          'Warning notices.',
          'Temporary selling restrictions.',
          'Withholding of payouts.',
          'Permanent account suspension.',
          'Account termination.',
          'Recovery of losses.',
          'Civil legal proceedings.',
          'Criminal complaints where applicable.',
        ],
      },
    ],
  },
  {
    title: '12. Intellectual Property',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller represents and warrants that they own or possess all necessary rights, licenses, permissions, and authorizations to use all content uploaded to AGTRENZ.',
      },
      { kind: 'p', text: 'This includes, but is not limited to:' },
      {
        kind: 'ul',
        items: [
          'Product images',
          'Logos',
          'Brand names',
          'Trademarks',
          'Product descriptions',
          'Videos',
          'User manuals',
          'Technical documents',
          'Marketing materials',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller shall not upload content that infringes the intellectual property rights of any third party.',
      },
      {
        kind: 'p',
        text: 'If AGTRENZ receives a complaint alleging intellectual property infringement, the Platform may immediately remove the relevant content without prior notice while the matter is investigated.',
      },
      {
        kind: 'p',
        text: "The Seller agrees to indemnify and hold AGTRENZ harmless against all intellectual property disputes, claims, damages, legal costs, settlements, or court proceedings arising from the Seller's products or uploaded content.",
      },
    ],
  },
  {
    title: '13. Privacy and Customer Data',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller shall access customer information solely for the purpose of fulfilling orders placed through AGTRENZ.',
      },
      { kind: 'p', text: 'Customer information must not be:' },
      {
        kind: 'ul',
        items: [
          'Sold.',
          'Shared with unauthorized persons.',
          'Used for unsolicited marketing.',
          'Copied for personal use.',
          'Stored beyond the period reasonably necessary to fulfil the order, unless required by law.',
        ],
      },
      {
        kind: 'p',
        text: 'The Seller shall implement reasonable technical and organizational measures to protect customer information from unauthorized access, disclosure, alteration, or loss.',
      },
      {
        kind: 'p',
        text: 'Any data breach involving customer information must be reported to AGTRENZ without unreasonable delay.',
      },
      {
        kind: 'p',
        text: 'Failure to protect customer information may result in immediate suspension and legal action.',
      },
    ],
  },
  {
    title: '14. Limitation of Liability',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ is solely an online technology marketplace that facilitates transactions between independent Buyers and Sellers.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ does not manufacture, import, export, distribute, warehouse, inspect, certify, endorse, own, possess, or sell products listed by Sellers.',
      },
      { kind: 'p', text: 'Accordingly, AGTRENZ shall not be liable for:' },
      {
        kind: 'ul',
        items: [
          'Product quality.',
          'Product safety.',
          'Product authenticity.',
          'Product legality.',
          'Product warranties.',
          'Product recalls.',
          'Manufacturing defects.',
          'Seller negligence.',
          'Customer misuse.',
          'Shipping delays caused by Sellers.',
          'Customs delays.',
          'Regulatory compliance.',
          'Product liability claims.',
          'Personal injuries.',
          'Health issues.',
          'Allergic reactions.',
          'Death.',
          'Property damage.',
          'Financial losses.',
          'Loss of business.',
          'Loss of profits.',
          'Consequential damages.',
          'Indirect damages.',
          'Punitive damages.',
        ],
      },
      { kind: 'p', text: 'The contract for the sale of goods exists exclusively between the Buyer and the Seller.' },
      {
        kind: 'p',
        text: 'Nothing in this Agreement shall make AGTRENZ the owner, supplier, manufacturer, importer, exporter, distributor, retailer, agent, or authorized representative of any product sold through the Platform.',
      },
      {
        kind: 'p',
        text: 'The Seller agrees that any claims relating to products sold through AGTRENZ shall be directed to the Seller, except where liability cannot legally be excluded under applicable law.',
      },
    ],
  },
  {
    title: '15. Indemnification',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller agrees to defend, indemnify, and hold harmless AGTRENZ, its directors, officers, employees, affiliates, contractors, partners, service providers, successors, and assigns from and against any claims, liabilities, damages, losses, penalties, fines, judgments, settlements, investigations, costs, and legal expenses arising out of or relating to:',
      },
      {
        kind: 'ul',
        items: [
          'Products sold by the Seller.',
          'Product defects.',
          'Product recalls.',
          'Product safety issues.',
          'Warranty claims.',
          'Consumer complaints.',
          'Intellectual property infringement.',
          'Tax liabilities.',
          'Customs violations.',
          'Regulatory investigations.',
          'Seller negligence.',
          'Fraud.',
          'Breach of this Agreement.',
          'Violation of applicable laws.',
          'Personal injury claims.',
          'Health-related claims.',
          'Property damage.',
          'Environmental claims.',
          'Financial losses suffered by Buyers or third parties.',
        ],
      },
      {
        kind: 'p',
        text: 'This indemnification obligation shall survive suspension or termination of the Seller account.',
      },
    ],
  },
  {
    title: '16. Account Suspension and Termination',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may, at its sole discretion, suspend, restrict, deactivate, or permanently terminate any Seller account where the Seller:',
      },
      {
        kind: 'ul',
        items: [
          'Violates this Agreement.',
          'Violates marketplace policies.',
          'Provides false information.',
          'Commits fraud.',
          'Receives repeated verified customer complaints.',
          'Sells counterfeit or prohibited products.',
          'Fails identity verification.',
          'Breaches applicable laws.',
          'Misuses the Platform.',
          'Creates an unacceptable risk to customers or the Platform.',
        ],
      },
      { kind: 'p', text: 'Where reasonably necessary, AGTRENZ may:' },
      {
        kind: 'ul',
        items: [
          'Remove product listings.',
          'Freeze Seller payouts.',
          'Cancel pending orders.',
          'Restrict account access.',
          'Require additional verification.',
          'Recover outstanding amounts owed by the Seller.',
        ],
      },
      {
        kind: 'p',
        text: 'Termination of the Seller account does not release the Seller from any obligations or liabilities arising before or after termination.',
      },
    ],
  },
  {
    title: '17. Force Majeure',
    blocks: [
      {
        kind: 'p',
        text: "AGTRENZ shall not be liable for any delay or failure to perform its obligations due to events beyond its reasonable control, including natural disasters, pandemics, war, terrorism, civil unrest, government actions, strikes, power failures, internet outages, cyberattacks, or other unforeseen events.",
      },
    ],
  },
  {
    title: '18. Changes to this Agreement',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ may update or modify this Agreement from time to time to reflect legal, operational, or business changes. Updated versions will be published on the Platform, and continued use of Seller services after publication constitutes acceptance of the revised Agreement.',
      },
    ],
  },
  {
    title: '19. Severability',
    blocks: [
      {
        kind: 'p',
        text: 'If any provision of this Agreement is found to be invalid, illegal, or unenforceable by a court or competent authority, the remaining provisions shall remain in full force and effect.',
      },
    ],
  },
  {
    title: '20. No Waiver',
    blocks: [
      {
        kind: 'p',
        text: 'Any failure or delay by AGTRENZ to enforce any provision of this Agreement shall not be considered a waiver of its rights to enforce that provision or any other provision in the future.',
      },
    ],
  },
  {
    title: '21. Assignment',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller may not assign, transfer, or delegate any rights or obligations under this Agreement without the prior written consent of AGTRENZ. AGTRENZ may assign its rights or obligations as part of a merger, acquisition, restructuring, or business transfer.',
      },
    ],
  },
  {
    title: '22. Electronic Acceptance',
    blocks: [
      {
        kind: 'p',
        text: 'The Seller agrees that creating a Seller account, accepting this Agreement electronically, or continuing to use AGTRENZ Seller services constitutes a legally binding electronic acceptance of this Agreement.',
      },
    ],
  },
  {
    title: '23. Entire Agreement',
    blocks: [
      {
        kind: 'p',
        text: 'This Agreement, together with all marketplace policies, shipping policies, return policies, privacy policies, and other policies published by AGTRENZ, constitutes the entire agreement between the Platform and the Seller and supersedes all prior discussions or understandings relating to Seller services.',
      },
    ],
  },
  {
    title: '24. Survival',
    blocks: [
      {
        kind: 'p',
        text: 'Any provisions relating to payments, taxes, refunds, warranties, product liability, indemnification, intellectual property, confidentiality, dispute resolution, and limitation of liability shall continue to remain in effect even after the Seller account is suspended or terminated.',
      },
    ],
  },
  {
    title: '25. Contact Information',
    blocks: [
      {
        kind: 'p',
        text: 'For questions regarding this Agreement or Seller account matters, Sellers may contact AGTRENZ through the official customer support channels available on the Platform.',
      },
    ],
  },
  {
    title: '26. Acceptance of Terms',
    blocks: [
      {
        kind: 'p',
        text: 'By registering as a Seller on AGTRENZ, listing products, or accepting customer orders, the Seller confirms that they have read, understood, and agreed to this Agreement. The Seller acknowledges that AGTRENZ operates solely as an online marketplace platform and that the Seller remains fully responsible for their products, taxes, warranties, legal compliance, customer obligations, and all liabilities arising from products sold through the Platform.',
      },
    ],
  },
]

export const sellerAgreementFooter: SellerAgreementBlock[] = [
  { kind: 'p', text: '**AGTRENZ**' },
  { kind: 'p', text: '**GLOBAL ECOMMERCE PLATFORM**' },
  { kind: 'p', text: '**REGISTERED IN INDIA, UNITED KINGDOM**' },
]
