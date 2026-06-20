import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StarIcon } from './Icons'
import { useAuth } from '../context/AuthContext'
import { useConfirmDialog } from '../context/ConfirmDialogContext'
import {
  deleteProductReview,
  fetchProductReviews,
  getReviewImageUrl,
  uploadReviewImage,
  upsertProductReview,
  type ProductReview,
} from '../lib/productReviews'

type ProductReviewsSectionProps = {
  productId: number
  onSummaryChange?: (summary: { reviewCount: number; averageRating: number }) => void
}

function StarSelector({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  return (
    <div className="product-reviews__stars-input" role="radiogroup" aria-label="Star rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1
        return (
          <button
            key={rating}
            type="button"
            className={rating <= value ? 'product-reviews__star product-reviews__star--active' : 'product-reviews__star'}
            aria-label={`${rating} star`}
            aria-pressed={rating <= value}
            disabled={disabled}
            onClick={() => onChange(rating)}
          >
            <StarIcon className={rating <= value ? 'star filled' : 'star'} />
          </button>
        )
      })}
    </div>
  )
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="product-reviews__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index + 1} className={index < rating ? 'star filled' : 'star'} />
      ))}
    </div>
  )
}

export function ProductReviewsSection({ productId, onSummaryChange }: ProductReviewsSectionProps) {
  const { isSignedIn, accountType } = useAuth()
  const { confirmAction } = useConfirmDialog()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [starRating, setStarRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)

  const ownReview = useMemo(
    () => reviews.find((review) => review.isOwnReview) ?? null,
    [reviews],
  )

  const canReview = isSignedIn && accountType === 'buyer'

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchProductReviews(productId)
      setReviews(rows)
      const count = rows.length
      const average = count > 0
        ? Math.round((rows.reduce((sum, row) => sum + row.starRating, 0) / count) * 10) / 10
        : 0
      onSummaryChange?.({ reviewCount: count, averageRating: average })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReviews()
  }, [productId])

  const resetForm = () => {
    setStarRating(0)
    setReviewText('')
    setImageFiles([])
    setEditingReviewId(null)
  }

  const handleSubmit = async () => {
    setError('')
    setMessage('')

    if (!canReview) {
      setError('Only signed-in buyers can submit reviews.')
      return
    }

    if (starRating < 1) {
      setError('Please select a star rating.')
      return
    }

    if (!reviewText.trim()) {
      setError('Please write your review.')
      return
    }

    setSaving(true)

    const uploadedImages = []
    for (const [index, file] of imageFiles.entries()) {
      const result = await uploadReviewImage(file)
      if (!result.ok) {
        setSaving(false)
        setError(result.message)
        return
      }
      uploadedImages.push({
        storagePath: result.storagePath,
        fileName: result.fileName,
        mimeType: result.mimeType,
        sortOrder: index,
      })
    }

    const existingImages = ownReview?.images.map((image, index) => ({
      storagePath: image.storagePath,
      fileName: image.fileName,
      mimeType: image.mimeType ?? undefined,
      sortOrder: index,
    })) ?? []

    const imagesToSave = uploadedImages.length > 0
      ? uploadedImages
      : (editingReviewId ? existingImages : [])

    const result = await upsertProductReview({
      productId,
      starRating,
      reviewText: reviewText.trim(),
      images: imagesToSave,
    })

    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setReviews(result.reviews)
    const count = result.reviews.length
    const average = count > 0
      ? Math.round((result.reviews.reduce((sum, row) => sum + row.starRating, 0) / count) * 10) / 10
      : 0
    onSummaryChange?.({ reviewCount: count, averageRating: average })
    setMessage(editingReviewId ? 'Review updated.' : 'Review posted.')
    if (!editingReviewId) {
      resetForm()
    }
  }

  const handleDelete = async (reviewId: number) => {
    const confirmed = await confirmAction('delete_review')
    if (!confirmed) return

    setSaving(true)
    setError('')
    const result = await deleteProductReview(reviewId)
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setReviews(result.reviews)
    const count = result.reviews.length
    const average = count > 0
      ? Math.round((result.reviews.reduce((sum, row) => sum + row.starRating, 0) / count) * 10) / 10
      : 0
    onSummaryChange?.({ reviewCount: count, averageRating: average })
    resetForm()
    setMessage('Review deleted.')
  }

  const startEdit = (review: ProductReview) => {
    setEditingReviewId(review.id)
    setStarRating(review.starRating)
    setReviewText(review.reviewText)
    setImageFiles([])
    setMessage('')
    setError('')
  }

  return (
    <section className="product-reviews">
      <div className="product-reviews__header">
        <h2>Customer reviews</h2>
        <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <p className="product-reviews__loading">Loading reviews…</p>
      ) : (
        <>
          {error && <div className="auth-message auth-message--error">{error}</div>}
          {message && <div className="auth-message auth-message--success">{message}</div>}

          {!canReview ? (
            <div className="product-reviews__signin-prompt">
              <p>Only signed-in buyers can write a review.</p>
              {!isSignedIn && <Link to="/buyer/signin">Sign in to review</Link>}
            </div>
          ) : ownReview && !editingReviewId ? (
            <div className="product-reviews__signin-prompt">
              <p>You already reviewed this product.</p>
              <button type="button" onClick={() => startEdit(ownReview)}>Edit your review</button>
            </div>
          ) : (
            <form
              className="product-reviews__form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSubmit()
              }}
            >
              <label>
                Your rating
                <StarSelector value={starRating} onChange={setStarRating} disabled={saving} />
              </label>
              <label>
                Your review
                <textarea
                  value={reviewText}
                  rows={4}
                  placeholder="Share your experience with this product"
                  disabled={saving}
                  onChange={(event) => setReviewText(event.target.value)}
                />
              </label>
              <label>
                Review photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  disabled={saving}
                  onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))}
                />
              </label>
              <div className="product-reviews__form-actions">
                <button type="submit" className="product-reviews__submit" disabled={saving}>
                  {saving ? 'Saving…' : editingReviewId ? 'Update review' : 'Post review'}
                </button>
                {editingReviewId && (
                  <button type="button" className="product-reviews__cancel" disabled={saving} onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="product-reviews__empty">No reviews yet. Be the first to review.</p>
          ) : (
            <div className="product-reviews__list">
              {reviews.map((review) => (
                <article key={review.id} className="product-reviews__item">
                  <div className="product-reviews__item-header">
                    <div>
                      <strong>{review.reviewerDisplayName}</strong>
                      <span className={`product-reviews__badge product-reviews__badge--${review.reviewType}`}>
                        {review.reviewTypeLabel}
                      </span>
                    </div>
                    <ReviewStars rating={review.starRating} />
                  </div>
                  <p>{review.reviewText}</p>
                  {review.images.length > 0 && (
                    <div className="product-reviews__images">
                      {review.images.map((image) => (
                        <img
                          key={image.id}
                          src={getReviewImageUrl(image.storagePath)}
                          alt={image.fileName}
                        />
                      ))}
                    </div>
                  )}
                  {review.isOwnReview && (
                    <div className="product-reviews__item-actions">
                      <button type="button" disabled={saving} onClick={() => startEdit(review)}>
                        Edit
                      </button>
                      <button type="button" disabled={saving} onClick={() => void handleDelete(review.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
