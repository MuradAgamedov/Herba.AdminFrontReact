import { apiFetch } from './client'

export interface BlogCategoryTranslation {
  id?: number
  name: string
  languageCode: string
  blogCategoryId?: number
}

export interface BlogCategory {
  id: number
  order: number
  status: boolean
  translations: BlogCategoryTranslation[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  take: number
  totalPages: number
}

export interface BlogCategoryListParams {
  search?: string
  page?: number
  take?: number
}

export interface BlogCategoryPayload {
  status: boolean
  translations: { name: string; languageCode: string }[]
}

export function listBlogCategories(
  params: BlogCategoryListParams = {},
): Promise<PagedResult<BlogCategory>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<BlogCategory>>(`/api/BlogCategory${qs ? `?${qs}` : ''}`)
}

export function getBlogCategory(id: number): Promise<BlogCategory> {
  return apiFetch<BlogCategory>(`/api/BlogCategory/${id}`)
}

export function createBlogCategory(payload: BlogCategoryPayload): Promise<BlogCategory> {
  return apiFetch<BlogCategory>('/api/BlogCategory', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateBlogCategory(
  id: number,
  payload: BlogCategoryPayload,
): Promise<BlogCategory> {
  return apiFetch<BlogCategory>(`/api/BlogCategory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteBlogCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/BlogCategory/${id}`, { method: 'DELETE' })
}

export function deleteBlogCategoriesRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/BlogCategory/range?${query.toString()}`, { method: 'DELETE' })
}
