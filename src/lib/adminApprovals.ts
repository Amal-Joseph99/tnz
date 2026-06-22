import { supabase } from './supabase'

export type KycQueueItem = {
  userId: string
  kycId: string
  status: string
  businessType: string
  businessName: string
  businessAddress: string
  taxId: string | null
  accountHolderName: string
  bankName: string
  accountNumber: string
  ifscSwift: string
  submittedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
  sellerEmail: string
  signupBusinessName: string
  countryName: string
  phone: string
}

type MutationResult = { ok: true } | { ok: false; message: string }

export function isTestProductListing(productName: string, sku = '') {
  const name = productName.trim()
  const normalizedSku = sku.trim()
  return name.startsWith('E2E Test') || normalizedSku.startsWith('SKUAT')
}

export type ProductQueueItem = {
  id: number
  userId: string
  sku: string
  productName: string
  categoryName: string
  subCategoryName: string
  productTypeName: string
  hsnCode: string
  brandName: string
  approvalStatus: string
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  sellerEmail: string
  sellerBusinessName: string
}

export type RejectionTemplate = {
  templateKey: string
  message: string
  sortOrder: number
}

export type KycDetail = {
  submission: Record<string, unknown>
  sellerEmail: string
  signupBusinessName: string
  countryName: string
  phone: string
  documents: Array<{
    documentType: string
    documentSlot?: number
    storagePath: string
    fileName: string
    mimeType: string
  }>
}

export type AdminProductDetail = {
  product: Record<string, unknown>
  specifications: Array<{ attributeName: string; attributeValue: string }>
  variants: Array<{
    variantId: string
    size: string
    color: string
    mrp: number
    sellingPrice: number
    stock: number
    imageStoragePath: string | null
  }>
  media: Array<{
    mediaType: string
    storagePath: string
    fileName: string
    mimeType: string
    slotIndex: number | null
  }>
}

export type FetchKycQueueResult = {
  items: KycQueueItem[]
  error?: string
}

export async function fetchKycQueue(status?: string): Promise<FetchKycQueueResult> {
  if (!supabase) {
    return { items: [], error: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('list_seller_kyc_submissions', {
    p_status: status ?? null,
  })

  if (error) {
    return { items: [], error: error.message }
  }

  if (!data) {
    return { items: [], error: 'No response from server.' }
  }

  return {
    items: data.map((row: Record<string, unknown>) => ({
    userId: String(row.user_id),
    kycId: String(row.kyc_id),
    status: String(row.status),
    businessType: String(row.business_type),
    businessName: String(row.business_name),
    businessAddress: String(row.business_address),
    taxId: row.tax_id ? String(row.tax_id) : null,
    accountHolderName: String(row.account_holder_name),
    bankName: String(row.bank_name),
    accountNumber: String(row.account_number),
    ifscSwift: String(row.ifsc_swift),
    submittedAt: String(row.submitted_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
    sellerEmail: String(row.seller_email),
    signupBusinessName: String(row.signup_business_name),
    countryName: String(row.country_name),
    phone: String(row.phone),
  })),
  }
}

export async function reviewSellerKyc(
  userId: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase.rpc('review_seller_kyc', {
    p_user_id: userId,
    p_approved: approved,
    p_rejection_reason: rejectionReason ?? null,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function fetchProductQueue(status?: string): Promise<ProductQueueItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_seller_product_submissions', {
    p_status: status ?? null,
  })

  if (error || !data) return []

  return data
    .map((row: Record<string, unknown>) => ({
      id: Number(row.id),
      userId: String(row.user_id),
      sku: String(row.sku),
      productName: String(row.product_name),
      categoryName: String(row.category_name),
      subCategoryName: String(row.sub_category_name),
      productTypeName: String(row.product_type_name),
      hsnCode: String(row.hsn_code),
      brandName: String(row.brand_name),
      approvalStatus: String(row.approval_status),
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      rejectionReason: row.rejection_reason ? String(row.rejection_reason) : null,
      sellerEmail: String(row.seller_email),
      sellerBusinessName: String(row.seller_business_name),
    }))
    .filter((row: ProductQueueItem) => !isTestProductListing(row.productName, row.sku))
}

export async function reviewSellerProduct(
  productId: number,
  approved: boolean,
  rejectionReason?: string,
): Promise<MutationResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { error } = await supabase.rpc('review_seller_product', {
    p_product_id: productId,
    p_approved: approved,
    p_rejection_reason: rejectionReason ?? null,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true }
}

export async function fetchPendingApprovalCounts() {
  if (!supabase) {
    return { pendingKyc: 0, pendingProducts: 0 }
  }

  const { data, error } = await supabase.rpc('count_pending_admin_approvals')
  if (error || !data) {
    return { pendingKyc: 0, pendingProducts: 0 }
  }

  return {
    pendingKyc: Number(data.pendingKyc ?? 0),
    pendingProducts: Number(data.pendingProducts ?? 0),
  }
}

export async function fetchRejectionTemplates(rejectionType: 'kyc' | 'product'): Promise<RejectionTemplate[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_rejection_templates', {
    p_rejection_type: rejectionType,
  })

  if (error || !data || !Array.isArray(data)) return []

  return data.map((row: Record<string, unknown>) => ({
    templateKey: String(row.templateKey),
    message: String(row.message),
    sortOrder: Number(row.sortOrder ?? 0),
  }))
}

export async function fetchAdminKycDetail(userId: string): Promise<KycDetail | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_admin_kyc_detail', { p_user_id: userId })
  if (error || !data) return null

  const payload = data as Record<string, unknown>
  const documents = Array.isArray(payload.documents) ? payload.documents : []

  return {
    submission: (payload.submission as Record<string, unknown>) ?? {},
    sellerEmail: String(payload.sellerEmail ?? ''),
    signupBusinessName: String(payload.signupBusinessName ?? ''),
    countryName: String(payload.countryName ?? ''),
    phone: String(payload.phone ?? ''),
    documents: documents.map((row) => {
      const doc = row as Record<string, unknown>
      return {
        documentType: String(doc.documentType ?? ''),
        documentSlot: doc.documentSlot != null ? Number(doc.documentSlot) : undefined,
        storagePath: String(doc.storagePath ?? ''),
        fileName: String(doc.fileName ?? ''),
        mimeType: String(doc.mimeType ?? ''),
      }
    }),
  }
}

export async function fetchAdminProductDetail(productId: number): Promise<AdminProductDetail | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_admin_product_detail', { p_product_id: productId })
  if (error || !data) return null

  const payload = data as Record<string, unknown>

  return {
    product: (payload.product as Record<string, unknown>) ?? {},
    specifications: Array.isArray(payload.specifications)
      ? payload.specifications.map((row) => {
          const spec = row as Record<string, unknown>
          return {
            attributeName: String(spec.attributeName ?? ''),
            attributeValue: String(spec.attributeValue ?? ''),
          }
        })
      : [],
    variants: Array.isArray(payload.variants)
      ? payload.variants.map((row) => {
          const variant = row as Record<string, unknown>
          return {
            variantId: String(variant.variantId ?? ''),
            size: String(variant.size ?? ''),
            color: String(variant.color ?? ''),
            mrp: Number(variant.mrp ?? 0),
            sellingPrice: Number(variant.sellingPrice ?? 0),
            stock: Number(variant.stock ?? 0),
            imageStoragePath: variant.imageStoragePath ? String(variant.imageStoragePath) : null,
          }
        })
      : [],
    media: Array.isArray(payload.media)
      ? payload.media.map((row) => {
          const item = row as Record<string, unknown>
          return {
            mediaType: String(item.mediaType ?? ''),
            storagePath: String(item.storagePath ?? ''),
            fileName: String(item.fileName ?? ''),
            mimeType: String(item.mimeType ?? ''),
            slotIndex: item.slotIndex != null ? Number(item.slotIndex) : null,
          }
        })
      : [],
  }
}
