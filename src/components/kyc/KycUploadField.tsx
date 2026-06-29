import { useEffect, useRef, useState } from 'react'
import type { KycDocumentSlot, KycDocumentType } from '../../lib/sellerKyc'
import { getSignedStorageUrl } from '../../lib/sellerStorage'

type KycUploadFieldProps = {
  label: string
  required?: boolean
  previewShape?: 'portrait' | 'document'
  documentType: KycDocumentType
  documentSlot: KycDocumentSlot
  fileName?: string
  mimeType?: string | null
  storagePath?: string
  progress: number
  disabled?: boolean
  onUpload: (file: File) => Promise<void>
  onDelete: () => Promise<void>
}

const FILE_HINT = 'JPEG, PNG, WebP, or PDF · max 10MB'

export function KycUploadField({
  label,
  required = false,
  previewShape = 'document',
  fileName,
  mimeType,
  storagePath,
  progress,
  disabled = false,
  onUpload,
  onDelete,
}: KycUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploading = progress > 0 && progress < 100
  const hasFile = Boolean(fileName && storagePath)
  const isImage = mimeType?.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  useEffect(() => {
    let active = true

    if (!storagePath || !isImage) {
      setPreviewUrl(null)
      return () => {
        active = false
      }
    }

    void getSignedStorageUrl('seller-kyc', storagePath).then((url) => {
      if (active) setPreviewUrl(url)
    })

    return () => {
      active = false
    }
  }, [isImage, storagePath])

  const shapeClass = previewShape === 'portrait' ? 'kyc-upload-drop--portrait' : 'kyc-upload-drop--document'

  const handleFile = (file: File | undefined) => {
    if (file) void onUpload(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled || isUploading || deleting) return
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <>
      <div
        className={`kyc-upload-drop ${shapeClass}${dragging ? ' kyc-upload-drop--dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled && !isUploading && !deleting) setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <p className="kyc-upload-drop__label">
          {label}
          {required ? <span className="kyc-form-required" aria-hidden="true"> *</span> : null}
        </p>

        {hasFile ? (
          <div className="kyc-upload-drop__preview">
            <div className="kyc-upload-drop__frame">
              {previewUrl ? (
                <button
                  type="button"
                  className="kyc-upload-drop__expand"
                  onClick={() => setExpanded(true)}
                  aria-label={`View full ${label}`}
                >
                  <img src={previewUrl} alt={fileName} />
                </button>
              ) : isPdf ? (
                <div className="kyc-upload-drop__pdf">
                  <span className="kyc-upload-drop__pdf-icon" aria-hidden="true">PDF</span>
                  <span>{fileName}</span>
                </div>
              ) : (
                <div className="kyc-upload-drop__file">
                  <span>{fileName}</span>
                </div>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                className="kyc-upload-drop__remove"
                disabled={deleting || isUploading}
                onClick={() => {
                  setDeleting(true)
                  void onDelete().finally(() => setDeleting(false))
                }}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="kyc-upload-drop__empty"
            disabled={disabled || isUploading || deleting}
            onClick={() => inputRef.current?.click()}
          >
            <span className="kyc-upload-drop__empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 16V4m0 0 8 8m-8-8-8 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20h16" strokeLinecap="round" />
              </svg>
            </span>
            <strong>Drag or click to upload</strong>
            <span className="kyc-upload-drop__hint">{FILE_HINT}</span>
          </button>
        )}

        {isUploading ? (
          <>
            <div className="kyc-progress" aria-label={`${label} upload progress`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <em className="kyc-upload-drop__progress">{progress}% uploading</em>
          </>
        ) : null}

        {!disabled && (
          <label className="kyc-upload-drop__btn">
            {hasFile ? 'Replace file' : 'Choose file'}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={isUploading || deleting}
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.currentTarget.value = ''
              }}
            />
          </label>
        )}
      </div>

      {expanded && previewUrl ? (
        <div
          className="kyc-upload-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} preview`}
          onClick={() => setExpanded(false)}
        >
          <button type="button" className="kyc-upload-lightbox__close" onClick={() => setExpanded(false)}>
            Close
          </button>
          <img src={previewUrl} alt={fileName} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  )
}
