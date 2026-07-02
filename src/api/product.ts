import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface ProductTranslation {
  id?: number
  name: string
  shortDescription: string
  description: string
  languageCode: string
  productId?: number
}

export interface Product {
  id: number
  slug: string
  productCategoryId: number
  imageUrl: string | null
  hoverImageUrl: string | null
  status: boolean
  translations: ProductTranslation[]
}

export interface ProductListParams {
  search?: string
  productCategoryId?: number
  page?: number
  take?: number
}

export interface ProductTranslationInput {
  languageCode: string
  name: string
  shortDescription: string
  description: string
}

export interface ProductPayload {
  slug: string
  productCategoryId: number
  status: boolean
  imageFile?: File | null
  hoverImageFile?: File | null
  translations: ProductTranslationInput[]
}

function buildProductFormData(payload: ProductPayload): FormData {
  const formData = new FormData()
  formData.append('Slug', payload.slug)
  formData.append('ProductCategoryId', String(payload.productCategoryId))
  formData.append('Status', String(payload.status))
  if (payload.imageFile) {
    formData.append('ImageFile', payload.imageFile)
  }
  if (payload.hoverImageFile) {
    formData.append('HoverImageFile', payload.hoverImageFile)
  }
  payload.translations.forEach((translation, index) => {
    formData.append(`Translations[${index}].LanguageCode`, translation.languageCode)
    formData.append(`Translations[${index}].Name`, translation.name)
    formData.append(`Translations[${index}].ShortDescription`, translation.shortDescription)
    formData.append(`Translations[${index}].Description`, translation.description)
  })
  return formData
}

export function listProducts(params: ProductListParams = {}): Promise<PagedResult<Product>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.productCategoryId) query.set('ProductCategoryId', String(params.productCategoryId))
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<Product>>(`/api/Product${qs ? `?${qs}` : ''}`)
}

export function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/api/Product/${id}`)
}

export function createProduct(payload: ProductPayload): Promise<Product> {
  return apiFetch<Product>('/api/Product', {
    method: 'POST',
    body: buildProductFormData(payload),
  })
}

export function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  return apiFetch<Product>(`/api/Product/${id}`, {
    method: 'PUT',
    body: buildProductFormData(payload),
  })
}

export function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`/api/Product/${id}`, { method: 'DELETE' })
}

export function deleteProductsRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/Product/range?${query.toString()}`, { method: 'DELETE' })
}
