export function resolveImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//.test(imageUrl)) return imageUrl

  const base = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '')
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}
