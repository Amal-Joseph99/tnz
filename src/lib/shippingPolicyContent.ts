export type ShippingPolicyBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

export type ShippingPolicySection = {
  title: string
  blocks: ShippingPolicyBlock[]
}

export const shippingPolicyIntro: ShippingPolicyBlock[] = [
  { kind: 'p', text: '**Last Updated:** June 29, 2026' },
  {
    kind: 'p',
    text: 'Thank you for shopping on AGTRENZ. This Shipping Policy explains how orders are processed, shipped, and delivered through our marketplace.',
  },
]

export const shippingPolicySections: ShippingPolicySection[] = [
  {
    title: '1. Marketplace Shipping',
    blocks: [
      { kind: 'p', text: 'AGTRENZ is an online marketplace connecting Buyers with independent Sellers.' },
      {
        kind: 'p',
        text: "Products are shipped by Sellers using shipping partners integrated with the AGTRENZ Platform. Shipping services may vary depending on the Seller's location, the Buyer's location, and product availability.",
      },
    ],
  },
  {
    title: '2. Order Processing',
    blocks: [
      { kind: 'p', text: 'After an order is successfully placed and payment is confirmed:' },
      {
        kind: 'ul',
        items: [
          'The order is forwarded to the Seller.',
          'The Seller is responsible for preparing and securely packaging the order.',
          'Orders are handed over to the assigned shipping partner for delivery.',
          'Buyers will receive shipment updates and tracking information where available.',
        ],
      },
      { kind: 'p', text: 'Processing times may vary depending on the Seller and product.' },
    ],
  },
  {
    title: '3. Shipping Partners',
    blocks: [
      {
        kind: 'p',
        text: 'AGTRENZ works with independent third-party logistics and courier providers in different countries.',
      },
      {
        kind: 'p',
        text: 'Shipping partners are responsible for transporting orders after collection from the Seller. Delivery services are subject to the terms, service availability, and operational conditions of the respective courier.',
      },
    ],
  },
  {
    title: '4. Delivery Time',
    blocks: [
      { kind: 'p', text: 'Estimated delivery times are displayed for convenience only.' },
      { kind: 'p', text: 'Actual delivery times may vary due to:' },
      {
        kind: 'ul',
        items: [
          'Seller processing time',
          'Delivery location',
          'Weather conditions',
          'Customs clearance',
          'Public holidays',
          'Transportation delays',
          'Government restrictions',
          'Other circumstances beyond reasonable control',
        ],
      },
      { kind: 'p', text: 'AGTRENZ does not guarantee delivery on a specific date or time.' },
    ],
  },
  {
    title: '5. Shipping Charges',
    blocks: [
      { kind: 'p', text: 'Shipping charges are calculated based on factors such as:' },
      {
        kind: 'ul',
        items: [
          'Delivery destination',
          'Package weight',
          'Package dimensions',
          'Shipping method',
          'Courier charges',
          'Applicable service fees',
        ],
      },
      { kind: 'p', text: 'Shipping costs, where applicable, are displayed before checkout.' },
    ],
  },
  {
    title: '6. Package Weight and Dimensions',
    blocks: [
      {
        kind: 'p',
        text: 'Sellers are responsible for providing accurate package weight and dimensions when listing products.',
      },
      {
        kind: 'p',
        text: 'If the actual shipment exceeds the declared weight or dimensions, any additional shipping or courier charges may be recovered from the Seller in accordance with the Seller Agreement.',
      },
    ],
  },
  {
    title: '7. Delivery Address',
    blocks: [
      {
        kind: 'p',
        text: 'Buyers are responsible for providing a complete and accurate delivery address, contact number, and other required delivery information.',
      },
      {
        kind: 'p',
        text: 'AGTRENZ is not responsible for delays, failed deliveries, or additional charges resulting from incorrect or incomplete delivery information provided by the Buyer.',
      },
    ],
  },
  {
    title: '8. Failed Delivery',
    blocks: [
      { kind: 'p', text: 'A delivery may fail if:' },
      {
        kind: 'ul',
        items: [
          'The Buyer is unavailable.',
          'The delivery address is incorrect.',
          'Delivery is refused.',
          'Local delivery restrictions apply.',
        ],
      },
      {
        kind: 'p',
        text: 'Additional shipping charges for re-delivery, return shipments, or storage fees may apply where permitted.',
      },
    ],
  },
  {
    title: '9. International Shipping',
    blocks: [
      { kind: 'p', text: 'Certain Sellers may offer international shipping.' },
      { kind: 'p', text: 'International orders may be subject to:' },
      {
        kind: 'ul',
        items: [
          'Customs inspections',
          'Import duties',
          'Taxes',
          'Local regulations',
          'Additional documentation requirements',
        ],
      },
      {
        kind: 'p',
        text: 'The Buyer is responsible for complying with the import laws of the destination country and for paying any applicable customs duties, taxes, or government charges unless otherwise stated.',
      },
    ],
  },
  {
    title: '10. Damaged or Missing Shipments',
    blocks: [
      {
        kind: 'p',
        text: 'If an order arrives damaged, incomplete, or appears to have been tampered with, the Buyer should report the issue through AGTRENZ as soon as reasonably possible and provide supporting photographs where available.',
      },
      {
        kind: 'p',
        text: 'Claims will be reviewed in accordance with the Return and Refund Policy and the Seller Agreement.',
      },
    ],
  },
  {
    title: '11. Delays Beyond Our Control',
    blocks: [
      {
        kind: 'p',
        text: 'Neither AGTRENZ nor the Seller shall be liable for delivery delays caused by events beyond reasonable control, including natural disasters, strikes, pandemics, customs delays, government actions, transportation disruptions, cyber incidents, or force majeure events.',
      },
    ],
  },
  {
    title: '12. Order Tracking',
    blocks: [
      {
        kind: 'p',
        text: 'Where supported by the shipping partner, Buyers can track their shipment using the tracking details provided after dispatch.',
      },
      { kind: 'p', text: 'Tracking availability depends on the courier service used.' },
    ],
  },
  {
    title: '13. Contact Us',
    blocks: [
      {
        kind: 'p',
        text: 'If you have any questions regarding shipping or delivery, please contact AGTRENZ through the official customer support channels available on the Platform.',
      },
    ],
  },
]
