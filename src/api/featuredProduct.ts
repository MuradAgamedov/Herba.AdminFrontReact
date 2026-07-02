import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface FeaturedProduct {
  id: number
  productId: number
}

export interface FeaturedProductListParams {
  page?: number
  take?: number
}

export function listFeaturedProducts(
  params: FeaturedProductListParams = {},
): Promise<PagedResult<FeaturedProduct>> {
  const query = new URLSearchParams()
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<FeaturedProduct>>(`/api/FeaturedProduct${qs ? `?${qs}` : ''}`)
}

export function createFeaturedProduct(productId: number): Promise<FeaturedProduct> {
  return apiFetch<FeaturedProduct>('/api/FeaturedProduct', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  })
}

export function deleteFeaturedProduct(id: number): Promise<void> {
  return apiFetch<void>(`/api/FeaturedProduct/${id}`, { method: 'DELETE' })
}

export function deleteFeaturedProductsRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/FeaturedProduct/range?${query.toString()}`, { method: 'DELETE' })
}
