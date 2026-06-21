const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function validateProductImageFile(file: File): string | null {
  const mime = file.type.toLowerCase()
  if (!ALLOWED_IMAGE_TYPES.has(mime)) {
    return 'Only JPEG, JPG, and PNG images are allowed.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Each image must be 10MB or smaller.'
  }
  return null
}

export function validateProductVideoFile(file: File): string | null {
  const mime = file.type.toLowerCase()
  if (!mime.startsWith('video/')) {
    return 'Only video files are allowed.'
  }
  if (file.size > 50 * 1024 * 1024) {
    return 'Each video must be 50MB or smaller.'
  }
  return null
}

export async function squareCropImageFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const size = Math.min(bitmap.width, bitmap.height)
  const sx = Math.floor((bitmap.width - size) / 2)
  const sy = Math.floor((bitmap.height - size) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, size, size)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92)
  })

  if (!blob) return file

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  return new File([blob], file.name.replace(/\.[^.]+$/, `.${extension}`), {
    type: blob.type,
    lastModified: Date.now(),
  })
}
