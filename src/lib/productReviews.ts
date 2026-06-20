import { supabase } from './supabase'

const REVIEW_BUCKET = 'product-reviews'

export type ProductReviewImage = {
  id: number
  storagePath: string
  fileName: string
  mimeType: string | null
  sortOrder: number
}

export type ProductReview = {
  id: number
  productId: number
  userId: string
  reviewerDisplayName: string
  starRating: number
  reviewText: string
  reviewType: 'general' | 'purchased'
  reviewTypeLabel: string
  createdAt: string
  updatedAt: string
  isOwnReview: boolean
  images: ProductReviewImage[]
}

export type ProductReviewSummary = {
  reviewCount: number
  averageRating: number
}

type ReviewImageInput = {
  storagePath: string
  fileName: string
  mimeType?: string
  sortOrder?: number
}

function mapReviewImage(raw: Record<string, unknown>): ProductReviewImage {
  return {
    id: Number(raw.id),
    storagePath: String(raw.storage_path),
    fileName: String(raw.file_name),
    mimeType: raw.mime_type ? String(raw.mime_type) : null,
    sortOrder: Number(raw.sort_order ?? 0),
  }
}

function mapReview(raw: Record<string, unknown>): ProductReview {
  const images = Array.isArray(raw.images)
    ? raw.images.map((image) => mapReviewImage(image as Record<string, unknown>))
    : []

  return {
    id: Number(raw.id),
    productId: Number(raw.product_id),
    userId: String(raw.user_id),
    reviewerDisplayName: String(raw.reviewer_display_name),
    starRating: Number(raw.star_rating),
    reviewText: String(raw.review_text),
    reviewType: raw.review_type === 'purchased' ? 'purchased' : 'general',
    reviewTypeLabel: String(raw.review_type_label),
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
    isOwnReview: Boolean(raw.is_own_review),
    images,
  }
}

export function getReviewImageUrl(storagePath: string) {
  if (!supabase) return ''
  const { data } = supabase.storage.from(REVIEW_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function fetchProductReviews(productId: number): Promise<ProductReview[]> {
  if (!supabase) return []

  const { data, error } = await supabase.rpc('list_product_reviews', {
    p_product_id: productId,
  })

  if (error || !Array.isArray(data)) {
    throw new Error(error?.message ?? 'Unable to load reviews.')
  }

  return data.map((row) => mapReview(row as Record<string, unknown>))
}

export async function fetchProductReviewSummary(productId: number): Promise<ProductReviewSummary> {
  if (!supabase) {
    return { reviewCount: 0, averageRating: 0 }
  }

  const { data, error } = await supabase.rpc('get_product_review_summary', {
    p_product_id: productId,
  })

  if (error || !data || typeof data !== 'object') {
    throw new Error(error?.message ?? 'Unable to load review summary.')
  }

  const payload = data as { review_count?: number; average_rating?: number }
  return {
    reviewCount: Number(payload.review_count ?? 0),
    averageRating: Number(payload.average_rating ?? 0),
  }
}

export async function uploadReviewImage(file: File): Promise<{ ok: true; storagePath: string; fileName: string; mimeType: string } | { ok: false; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) {
    return { ok: false, message: 'You must be signed in.' }
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(REVIEW_BUCKET).upload(storagePath, file, {
    upsert: false,
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

export async function upsertProductReview(input: {
  productId: number
  starRating: number
  reviewText: string
  images: ReviewImageInput[]
}) {
  if (!supabase) {
    return { ok: false as const, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('upsert_product_review', {
    p_product_id: input.productId,
    p_star_rating: input.starRating,
    p_review_text: input.reviewText,
    p_image_paths: input.images.map((image, index) => ({
      storage_path: image.storagePath,
      file_name: image.fileName,
      mime_type: image.mimeType ?? null,
      sort_order: image.sortOrder ?? index,
    })),
  })

  if (error) {
    return { ok: false as const, message: error.message }
  }

  const reviews = Array.isArray(data)
    ? data.map((row) => mapReview(row as Record<string, unknown>))
    : []

  return { ok: true as const, reviews }
}

export async function deleteProductReview(reviewId: number) {
  if (!supabase) {
    return { ok: false as const, message: 'Supabase is not configured.' }
  }

  const { data, error } = await supabase.rpc('delete_product_review', {
    p_review_id: reviewId,
  })

  if (error) {
    return { ok: false as const, message: error.message }
  }

  const reviews = Array.isArray(data)
    ? data.map((row) => mapReview(row as Record<string, unknown>))
    : []

  return { ok: true as const, reviews }
}
