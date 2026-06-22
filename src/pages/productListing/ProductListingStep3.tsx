import { useState } from 'react'
import { ProductListingWizardNav } from '../../components/productListing/ProductListingWizardShell'
import { useProductListingDraft } from '../../context/ProductListingDraftContext'
import {
  squareCropImageFile,
  validateProductImageFile,
  validateProductVideoFile,
} from '../../lib/productImageProcessing'
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_VIDEOS,
  MIN_PRODUCT_IMAGES,
  buildVariantId,
  validateStep3,
  type VariantDraft,
} from '../../lib/productListingWizard'
import { uploadProductMediaFile } from '../../lib/sellerStorage'

type Step3Props = {
  productId: number | null
  onBack: () => void
  onNext: () => void
}

export function ProductListingStep3({ productId, onBack, onNext }: Step3Props) {
  const { draft, options, setDraft, isReadOnly, saving } = useProductListingDraft()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const images = draft.media.filter((item) => item.mediaType === 'product_image')
  const videos = draft.media.filter((item) => item.mediaType === 'product_video')

  const addVariantsFromSelection = (size: string, color: string) => {
    const exists = draft.variants.some((variant) => variant.size === size && variant.color === color)
    if (exists) return

    const nextVariant: VariantDraft = {
      variantId: buildVariantId(size, color, draft.variants.length),
      size,
      color,
      mrp: 0,
      sellingPrice: 0,
      stock: 0,
      sortOrder: draft.variants.length,
    }

    setDraft((current) => ({ ...current, variants: [...current.variants, nextVariant] }))
  }

  const ensureDefaultVariant = () => {
    if (draft.variants.length > 0) return
    addVariantsFromSelection('Free Size', 'No Color')
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || isReadOnly) return
    const remaining = MAX_PRODUCT_IMAGES - images.length
    const selected = Array.from(files).slice(0, remaining)
    if (selected.length === 0) return

    setUploading(true)
    for (const file of selected) {
      const validationError = validateProductImageFile(file)
      if (validationError) {
        window.alert(validationError)
        continue
      }

      const key = `${file.name}-${file.size}`
      setUploadProgress((current) => ({ ...current, [key]: 20 }))
      const squared = await squareCropImageFile(file)
      const upload = await uploadProductMediaFile(productId, 'product_image', squared)
      if (!upload.ok) {
        window.alert(upload.message)
        continue
      }

      setUploadProgress((current) => ({ ...current, [key]: 100 }))
      setDraft((current) => ({
        ...current,
        media: [
          ...current.media,
          {
            mediaType: 'product_image',
            storagePath: upload.storagePath,
            fileName: upload.fileName,
            mimeType: upload.mimeType,
            slotIndex: current.media.filter((item) => item.mediaType === 'product_image').length + 1,
            sortOrder: current.media.length,
            previewUrl: URL.createObjectURL(squared),
          },
        ],
      }))
    }
    setUploading(false)
  }

  const handleVideoUpload = async (files: FileList | null) => {
    if (!files || isReadOnly) return
    const file = files[0]
    if (!file) return
    if (videos.length >= MAX_PRODUCT_VIDEOS) return

    const validationError = validateProductVideoFile(file)
    if (validationError) {
      window.alert(validationError)
      return
    }

    setUploading(true)
    const upload = await uploadProductMediaFile(productId, 'product_video', file)
    setUploading(false)
    if (!upload.ok) {
      window.alert(upload.message)
      return
    }

    setDraft((current) => ({
      ...current,
      media: [
        ...current.media,
        {
          mediaType: 'product_video',
          storagePath: upload.storagePath,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          sortOrder: current.media.length,
        },
      ],
    }))
  }

  return (
    <section className="seller-console-card listing-step">
      <div className="listing-step__section">
        <h2>Image upload</h2>
        <p className="listing-step__hint">
          Gallery upload only. JPEG/JPG/PNG up to 10MB each. Minimum {MIN_PRODUCT_IMAGES}, maximum {MAX_PRODUCT_IMAGES} square images.
        </p>
        {!isReadOnly && (
          <label className="seller-primary-action listing-upload-btn">
            Select images from gallery
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              hidden
              onChange={(event) => void handleImageUpload(event.target.files)}
            />
          </label>
        )}
        <div className="listing-media-grid">
          {images.map((image) => (
            <article key={image.storagePath} className="listing-media-card">
              {image.previewUrl ? <img src={image.previewUrl} alt={image.fileName} /> : <span>{image.fileName}</span>}
              {!isReadOnly && (
                <button
                  type="button"
                  className="listing-icon-btn"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      media: current.media.filter((item) => item.storagePath !== image.storagePath),
                    }))
                  }
                >
                  Remove
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="listing-field-hint">{images.length}/{MAX_PRODUCT_IMAGES} images uploaded</p>
        {Object.values(uploadProgress).some((value) => value > 0 && value < 100) ? (
          <p className="listing-field-hint">Uploading images...</p>
        ) : null}
      </div>

      <div className="listing-step__section">
        <h2>Video upload (optional)</h2>
        <p className="listing-step__hint">Up to {MAX_PRODUCT_VIDEOS} videos, 50MB each.</p>
        {!isReadOnly && videos.length < MAX_PRODUCT_VIDEOS && (
          <label className="seller-secondary-action listing-upload-btn">
            Select video
            <input type="file" accept="video/*" hidden onChange={(event) => void handleVideoUpload(event.target.files)} />
          </label>
        )}
        <ul className="listing-file-list">
          {videos.map((video) => (
            <li key={video.storagePath}>{video.fileName}</li>
          ))}
        </ul>
      </div>

      <div className="listing-step__section">
        <h2>Variant section</h2>
        <div className="listing-form-grid">
          <label>
            Size variant
            <select
              disabled={isReadOnly}
              onChange={(event) => addVariantsFromSelection(event.target.value, 'No Color')}
              defaultValue=""
            >
              <option value="" disabled>Add size variant</option>
              {options.sizePresets.map((item) => (
                <option key={item.code} value={item.label}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            Colour variant
            <select
              disabled={isReadOnly}
              onChange={(event) => addVariantsFromSelection('Free Size', event.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Add colour variant</option>
              {options.colorPresets.map((item) => (
                <option key={item.code} value={item.label}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
        {!isReadOnly && (
          <button type="button" className="seller-secondary-action" onClick={ensureDefaultVariant}>
            Use default free-size variant
          </button>
        )}

        <div className="listing-variant-table">
          <div className="listing-variant-table__row listing-variant-table__row--head">
            <span>Variant ID</span><span>Size</span><span>Colour</span><span>MRP</span><span>Sell price</span><span>Stock</span><span>Image</span><span />
          </div>
          {draft.variants.map((variant, index) => (
            <div className="listing-variant-table__row" key={`${variant.variantId}-${index}`}>
              <span>{variant.variantId || 'Auto on save'}</span>
              <span>{variant.size}</span>
              <span>{variant.color}</span>
              <input
                type="number"
                disabled={isReadOnly}
                value={variant.mrp || ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    variants: current.variants.map((row, i) =>
                      i === index ? { ...row, mrp: Number(event.target.value) } : row,
                    ),
                  }))
                }
              />
              <input
                type="number"
                disabled={isReadOnly}
                value={variant.sellingPrice || ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    variants: current.variants.map((row, i) =>
                      i === index ? { ...row, sellingPrice: Number(event.target.value) } : row,
                    ),
                  }))
                }
              />
              <input
                type="number"
                disabled={isReadOnly}
                value={variant.stock || ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    variants: current.variants.map((row, i) =>
                      i === index ? { ...row, stock: Number(event.target.value) } : row,
                    ),
                  }))
                }
              />
              <label className="listing-upload-mini">
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    void (async () => {
                      const squared = await squareCropImageFile(file)
                      const upload = await uploadProductMediaFile(productId, `variant_${index}`, squared)
                      if (!upload.ok) {
                        window.alert(upload.message)
                        return
                      }
                      setDraft((current) => ({
                        ...current,
                        variants: current.variants.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                imageStoragePath: upload.storagePath,
                                imageFileName: upload.fileName,
                              }
                            : row,
                        ),
                      }))
                    })()
                  }}
                />
              </label>
              {!isReadOnly && (
                <button
                  type="button"
                  className="listing-icon-btn"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      variants: current.variants.filter((_, i) => i !== index),
                    }))
                  }
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ProductListingWizardNav
        onBack={onBack}
        onNext={() => {
          const validationError = validateStep3(draft)
          if (validationError) {
            window.alert(validationError)
            return
          }
          onNext()
        }}
        saving={saving || uploading}
        nextDisabled={isReadOnly}
      />
    </section>
  )
}
