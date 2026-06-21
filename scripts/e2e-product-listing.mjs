/**
 * E2E smoke test: seller product listing + admin approval + storefront visibility.
 * Run: node scripts/e2e-product-listing.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env')
  const text = readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const anonKey = env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const SELLER_EMAIL = 'metricfluxsolutions@gmail.com'
const ADMIN_EMAIL = 'info@agtrenz.com'
const TEST_PASSWORD = 'Agtrenz@5656'

function buildDraft(overrides = {}) {
  return {
    sku: '',
    approvalStatus: 'draft',
    listingStep: 1,
    categoryName: 'Electronics',
    subCategoryName: 'Mobile Phones',
    productTypeName: 'Smartphones',
    hsnCode: '85171300',
    itemConditionCode: 'brand_new',
    productName: `E2E Test Face Wash ${Date.now()}`,
    brandName: 'BEAUZEAD',
    shortDescription: 'Automated E2E test listing for wizard approval flow.',
    fullDescriptionBullets: [
      'Lightweight formula',
      'Suitable for all skin types',
      'Dermatologically tested',
    ],
    specifications: [
      { attributeName: 'Weight', attributeValue: '100g', sortOrder: 0 },
      { attributeName: 'Color', attributeValue: 'White', sortOrder: 1 },
    ],
    manufacturerName: 'BEAUZEAD Labs Pvt Ltd',
    manufacturerCountry: 'India',
    originCountry: 'India',
    ingredients: 'Aqua, Glycerin, Niacinamide, Aloe Vera Extract, Vitamin E',
    usageInstructions: 'Apply evenly on skin twice daily. Avoid contact with eyes.',
    importantNote: 'For external use only. Keep out of reach of children.',
    warrantyAvailable: true,
    warrantyPeriodCode: '1_year',
    warrantyType: 'Manufacturer Warranty',
    containsBattery: false,
    containsLiquid: true,
    containsMagneticMaterial: false,
    containsAerosol: false,
    containsFlammableMaterial: false,
    packageContentsBullets: ['1 x Face Wash', '1 x User Manual'],
    variants: [
      {
        variantId: `VAR-E2E-${Date.now()}`,
        size: 'Free Size',
        color: 'No Color',
        mrp: 499,
        sellingPrice: 399,
        stock: 25,
        sortOrder: 0,
      },
    ],
    media: [
      {
        mediaType: 'product_image',
        storagePath: 'e2e-test/product-image-1.jpg',
        fileName: 'product-image-1.jpg',
        mimeType: 'image/jpeg',
        slotIndex: 1,
        sortOrder: 0,
      },
      {
        mediaType: 'product_image',
        storagePath: 'e2e-test/product-image-2.jpg',
        fileName: 'product-image-2.jpg',
        mimeType: 'image/jpeg',
        slotIndex: 2,
        sortOrder: 1,
      },
      {
        mediaType: 'product_image',
        storagePath: 'e2e-test/product-image-3.jpg',
        fileName: 'product-image-3.jpg',
        mimeType: 'image/jpeg',
        slotIndex: 3,
        sortOrder: 2,
      },
    ],
    packageLength: 12,
    packageWidth: 8,
    packageHeight: 5,
    packageLengthUnitCode: 'cm',
    packageWidthUnitCode: 'cm',
    packageHeightUnitCode: 'cm',
    packageWeight: 0.2,
    packageWeightUnitCode: 'kg',
    returnEligible: true,
    returnWindowCode: '15_days',
    returnReasonCodes: ['any_reason'],
    declarationAccurate: true,
    declarationPolicy: true,
    declarationLegalRight: true,
    declarationTerms: true,
    ...overrides,
  }
}

async function signIn(email, password) {
  const client = createClient(url, anonKey)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign in failed for ${email}: ${error.message}`)
  return client
}

async function main() {
  const results = []
  const log = (step, ok, detail = '') => {
    results.push({ step, ok, detail })
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}${detail ? ` — ${detail}` : ''}`)
  }

  let productId = null
  let sku = null

  try {
    const seller = await signIn(SELLER_EMAIL, TEST_PASSWORD)
    log('Seller sign-in', true, SELLER_EMAIL)

    const draft = buildDraft()

    const step1 = await seller.rpc('save_seller_product_listing_draft', {
      p_product_id: null,
      p_step: 1,
      p_generate_sku: true,
      p_payload: draft,
    })
    if (step1.error) throw new Error(`Step 1 save: ${step1.error.message}`)
    productId = Number(step1.data.productId)
    sku = String(step1.data.sku)
    log('Step 1 draft + SKU', Boolean(productId && sku), `productId=${productId}, sku=${sku}`)

    const fullSave = await seller.rpc('save_seller_product_listing_draft', {
      p_product_id: productId,
      p_step: 5,
      p_generate_sku: false,
      p_payload: { ...draft, sku, listingStep: 5 },
    })
    if (fullSave.error) throw new Error(`Full draft save: ${fullSave.error.message}`)
    log('Full draft save (steps 1-5 data)', true)

    const submit = await seller.rpc('submit_seller_product_listing', {
      p_product_id: productId,
      p_payload: { ...draft, sku, listingStep: 5 },
    })
    if (submit.error) throw new Error(`Submit: ${submit.error.message}`)
    log('Submit for approval', true)

    const { data: pendingRow, error: pendingError } = await seller
      .from('seller_products')
      .select('approval_status, submitted_at')
      .eq('id', productId)
      .single()
    if (pendingError) throw new Error(pendingError.message)
    log('Product status pending', pendingRow.approval_status === 'pending', pendingRow.approval_status)

    await seller.auth.signOut()

    const admin = await signIn(ADMIN_EMAIL, TEST_PASSWORD)
    log('Admin sign-in', true, ADMIN_EMAIL)

    const queue = await admin.rpc('list_seller_product_submissions', { p_status: 'pending' })
    if (queue.error) throw new Error(`Queue: ${queue.error.message}`)
    const inQueue = (queue.data ?? []).some((row) => Number(row.id) === productId)
    log('Product in admin queue', inQueue)

    const detail = await admin.rpc('get_admin_product_detail', { p_product_id: productId })
    if (detail.error) throw new Error(`Admin detail: ${detail.error.message}`)
    const product = detail.data?.product ?? {}
    log(
      'Admin detail has wizard fields',
      Boolean(product.full_description_bullets && product.usage_instructions && product.return_eligible),
      `bullets=${JSON.stringify(product.full_description_bullets).slice(0, 60)}...`,
    )

    const approve = await admin.rpc('review_seller_product', {
      p_product_id: productId,
      p_approved: true,
      p_rejection_reason: null,
    })
    if (approve.error) throw new Error(`Approve: ${approve.error.message}`)
    log('Admin approval', true)

    const { data: approvedRow, error: approvedError } = await admin
      .from('seller_products')
      .select('approval_status, reviewed_at')
      .eq('id', productId)
      .single()
    if (approvedError) throw new Error(approvedError.message)
    log('Product status approved', approvedRow.approval_status === 'approved', approvedRow.approval_status)

    await admin.auth.signOut()

    const storefront = createClient(url, anonKey)
    const { data: storefrontProduct, error: storefrontError } = await storefront
      .from('seller_products')
      .select('id, product_name, sku, full_description_bullets, usage_instructions, return_eligible, approval_status')
      .eq('id', productId)
      .eq('approval_status', 'approved')
      .maybeSingle()
    if (storefrontError) throw new Error(storefrontError.message)
    log(
      'Storefront can read approved product',
      Boolean(storefrontProduct),
      storefrontProduct?.product_name ?? 'not found',
    )

    const { data: variants } = await storefront
      .from('seller_product_variants')
      .select('variant_id, stock, selling_price')
      .eq('product_id', productId)
    log('Storefront variants', (variants ?? []).length > 0, `${variants?.length ?? 0} variant(s)`)

    const failed = results.filter((item) => !item.ok)
    console.log('\n--- Summary ---')
    console.log(`Product ID: ${productId}`)
    console.log(`SKU: ${sku}`)
    console.log(`Storefront URL: /product/${productId}`)
    console.log(`Admin URL: /admin/products`)
    console.log(`Passed: ${results.length - failed.length}/${results.length}`)

    if (failed.length > 0) process.exit(1)
  } catch (error) {
    console.error('\nE2E test aborted:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
