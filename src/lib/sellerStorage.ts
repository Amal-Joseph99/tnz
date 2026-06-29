import { supabase } from './supabase'

const KYC_BUCKET = 'seller-kyc'
const PRODUCT_BUCKET = 'seller-products'

export type UploadResult =
  | { ok: true; storagePath: string; fileName: string; mimeType: string }
  | { ok: false; message: string }

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

const ALLOWED_KYC_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_KYC_BYTES = 10 * 1024 * 1024

export function validateKycDocumentFile(file: File): string | null {
  const mime = file.type.toLowerCase()
  if (!ALLOWED_KYC_TYPES.has(mime)) {
    return 'Only JPEG, PNG, WebP, or PDF files are allowed.'
  }
  if (file.size > MAX_KYC_BYTES) {
    return 'Each file must be 10MB or smaller.'
  }
  return null
}

export async function uploadKycDocument(
  documentType: string,
  file: File,
  documentSlot = 1,
): Promise<UploadResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in.' }
  }

  const safeName = sanitizeFileName(file.name)
  const storagePath = `${user.id}/${documentType}/slot-${documentSlot}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(KYC_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return {
    ok: true,
    storagePath,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
  }
}

export async function uploadProductMediaFile(
  productId: number | null,
  mediaFolder: string,
  file: File,
): Promise<UploadResult> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in.' }
  }

  const folder = productId ? `${user.id}/${productId}/${mediaFolder}` : `${user.id}/draft/${mediaFolder}`
  const safeName = sanitizeFileName(file.name)
  const storagePath = `${folder}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return {
    ok: true,
    storagePath,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
  }
}

export async function getSignedStorageUrl(bucket: string, storagePath: string) {
  if (!supabase) return null

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 3600)
  if (error || !data) return null
  return data.signedUrl
}
