/**
 * Complete admin approval for an already-submitted pending product.
 * Run: node scripts/e2e-approve-product.mjs [productId]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  }
  return env
}

const env = loadEnv()
const productId = Number(process.argv[2] || 3)
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const { error: signInError } = await client.auth.signInWithPassword({
  email: 'info@agtrenz.com',
  password: 'Agtrenz@5656',
})
if (signInError) throw signInError

const queue = await client.rpc('list_seller_product_submissions', { p_status: 'pending' })
if (queue.error) throw queue.error
console.log('Pending queue count:', queue.data?.length ?? 0)

const detail = await client.rpc('get_admin_product_detail', { p_product_id: productId })
if (detail.error) throw detail.error
console.log('Product:', detail.data?.product?.product_name, detail.data?.product?.sku)

const approve = await client.rpc('review_seller_product', {
  p_product_id: productId,
  p_approved: true,
  p_rejection_reason: null,
})
if (approve.error) throw approve.error

const { data: row } = await client
  .from('seller_products')
  .select('approval_status, product_name, sku')
  .eq('id', productId)
  .single()

console.log('Approved:', row)
console.log('Storefront:', `https://www.agtrenz.com/product/${productId}`)
