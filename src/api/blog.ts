import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface BlogTranslation {
  id?: number
  title: string
  author: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  imageAltText: string
  languageCode: string
  blogId?: number
}

export interface Blog {
  id: number
  slug: string
  blogCategoryId: number
  readMinutes: number | null
  publishedAt: string
  imageUrl: string | null
  status: boolean
  translations: BlogTranslation[]
}

export interface BlogListParams {
  search?: string
  page?: number
  take?: number
}

export interface BlogTranslationInput {
  languageCode: string
  title: string
  author: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  imageAltText: string
}

export interface BlogPayload {
  slug: string
  blogCategoryId: number
  readMinutes?: number
  publishedAt: string
  status: boolean
  imageFile?: File | null
  translations: BlogTranslationInput[]
}

function buildBlogFormData(payload: BlogPayload): FormData {
  const formData = new FormData()
  formData.append('Slug', payload.slug)
  formData.append('BlogCategoryId', String(payload.blogCategoryId))
  if (payload.readMinutes !== undefined) {
    formData.append('ReadMinutes', String(payload.readMinutes))
  }
  formData.append('PublishedAt', payload.publishedAt)
  formData.append('Status', String(payload.status))
  if (payload.imageFile) {
    formData.append('ImageFile', payload.imageFile)
  }
  payload.translations.forEach((translation, index) => {
    formData.append(`Translations[${index}].LanguageCode`, translation.languageCode)
    formData.append(`Translations[${index}].Title`, translation.title)
    formData.append(`Translations[${index}].Author`, translation.author)
    formData.append(`Translations[${index}].ShortDescription`, translation.shortDescription)
    formData.append(`Translations[${index}].Description`, translation.description)
    formData.append(`Translations[${index}].SeoTitle`, translation.seoTitle)
    formData.append(`Translations[${index}].SeoDescription`, translation.seoDescription)
    formData.append(`Translations[${index}].SeoKeywords`, translation.seoKeywords)
    formData.append(`Translations[${index}].ImageAltText`, translation.imageAltText)
  })
  return formData
}

export function listBlogs(params: BlogListParams = {}): Promise<PagedResult<Blog>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<Blog>>(`/api/Blog${qs ? `?${qs}` : ''}`)
}

export function getBlog(id: number): Promise<Blog> {
  return apiFetch<Blog>(`/api/Blog/${id}`)
}

export function createBlog(payload: BlogPayload): Promise<Blog> {
  return apiFetch<Blog>('/api/Blog', {
    method: 'POST',
    body: buildBlogFormData(payload),
  })
}

export function updateBlog(id: number, payload: BlogPayload): Promise<Blog> {
  return apiFetch<Blog>(`/api/Blog/${id}`, {
    method: 'PUT',
    body: buildBlogFormData(payload),
  })
}

export function deleteBlog(id: number): Promise<void> {
  return apiFetch<void>(`/api/Blog/${id}`, { method: 'DELETE' })
}

export function deleteBlogsRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/Blog/range?${query.toString()}`, { method: 'DELETE' })
}

