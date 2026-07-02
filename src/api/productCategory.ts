import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface ProductCategoryTranslation {
  id?: number
  name: string
  languageCode: string
  productCategoryId?: number
}

export interface ProductCategory {
  id: number
  slug: string
  icon: string | null
  status: boolean
  translations: ProductCategoryTranslation[]
}

export interface ProductCategoryListParams {
  search?: string
  page?: number
  take?: number
}

export interface ProductCategoryPayload {
  slug: string
  icon: string
  status: boolean
  translations: { name: string; languageCode: string }[]
}

export function listProductCategories(
  params: ProductCategoryListParams = {},
): Promise<PagedResult<ProductCategory>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<ProductCategory>>(`/api/ProductCategory${qs ? `?${qs}` : ''}`)
}

export function getProductCategory(id: number): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/api/ProductCategory/${id}`)
}

export function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategory> {
  return apiFetch<ProductCategory>('/api/ProductCategory', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProductCategory(
  id: number,
  payload: ProductCategoryPayload,
): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/api/ProductCategory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProductCategory(id: number): Promise<void> {
  return apiFetch<void>(`/api/ProductCategory/${id}`, { method: 'DELETE' })
}

export function deleteProductCategoriesRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/ProductCategory/range?${query.toString()}`, { method: 'DELETE' })
}
