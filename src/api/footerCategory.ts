import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface FooterCategory {
  id: number
  blogCategoryId: number
}

export interface FooterCategoryListParams {
  page?: number
  take?: number
}

export function listFooterCategories(
  params: FooterCategoryListParams = {},
): Promise<PagedResult<FooterCategory>> {
  const query = new URLSearchParams()
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<FooterCategory>>(`/api/FooterCategory${qs ? `?${qs}` : ''}`)
}

export function createFooterCategory(blogCategoryId: number): Promise<FooterCategory> {
  return apiFetch<FooterCategory>('/api/FooterCategory', {
    method: 'POST',
    body: JSON.stringify({ blogCategoryId }),
  })
}

export function deleteFooterCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/FooterCategory/${id}`, { method: 'DELETE' })
}

export function deleteFooterCategoriesRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/FooterCategory/range?${query.toString()}`, { method: 'DELETE' })
}
