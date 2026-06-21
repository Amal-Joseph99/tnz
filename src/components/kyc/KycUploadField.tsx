import { useEffect, useState } from 'react'
import type { KycDocumentSlot, KycDocumentType } from '../../lib/sellerKyc'
import { getSignedStorageUrl } from '../../lib/sellerStorage'

type KycUploadFieldProps = {
  label: string
  required?: boolean
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

export function KycUploadField({
  label,
  required = false,
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
  const isUploading = progress > 0 && progress < 100
  const hasFile = Boolean(fileName && storagePath)

  useEffect(() => {
    let active = true

    if (!storagePath || !mimeType?.startsWith('image/')) {
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
  }, [mimeType, storagePath])

  return (
    <div className="kyc-upload-drop">
      <p className="kyc-upload-drop__label">
        {label}
        {required ? <span className="kyc-form-required" aria-hidden="true"> *</span> : null}
      </p>

      {hasFile ? (
        <div className="kyc-upload-drop__preview">
          {previewUrl ? (
            <img src={previewUrl} alt={fileName} />
          ) : (
            <div className="kyc-upload-drop__file">
              <span>{fileName}</span>
            </div>
          )}
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
        <p className="kyc-upload-drop__name">No file selected</p>
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
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={isUploading || deleting}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onUpload(file)
              event.currentTarget.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
