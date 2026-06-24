/** Replace with your YouTube video ID when ready, e.g. `dQw4w9WgXcQ` */
export const SELLER_HOW_TO_PACK_YOUTUBE_VIDEO_ID = ''

export function buildHowToPackEmbedUrl(videoId = SELLER_HOW_TO_PACK_YOUTUBE_VIDEO_ID) {
  const trimmed = videoId.trim()
  if (!trimmed) return null
  return `https://www.youtube.com/embed/${trimmed}`
}
