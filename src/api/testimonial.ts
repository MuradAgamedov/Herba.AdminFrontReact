import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface TestimonialTranslation {
  id?: number
  quote: string
  role: string
  languageCode: string
  testimonialId?: number
}

export interface Testimonial {
  id: number
  customerName: string
  rating: number
  status: boolean
  translations: TestimonialTranslation[]
}

export interface TestimonialListParams {
  search?: string
  page?: number
  take?: number
}

export interface TestimonialPayload {
  customerName: string
  rating: number
  status: boolean
  translations: { quote: string; role: string; languageCode: string }[]
}

export function listTestimonials(
  params: TestimonialListParams = {},
): Promise<PagedResult<Testimonial>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<Testimonial>>(`/api/Testimonial${qs ? `?${qs}` : ''}`)
}

export function getTestimonial(id: number): Promise<Testimonial> {
  return apiFetch<Testimonial>(`/api/Testimonial/${id}`)
}

export function createTestimonial(payload: TestimonialPayload): Promise<Testimonial> {
  return apiFetch<Testimonial>('/api/Testimonial', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTestimonial(id: number, payload: TestimonialPayload): Promise<Testimonial> {
  return apiFetch<Testimonial>(`/api/Testimonial/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteTestimonial(id: number): Promise<void> {
  return apiFetch<void>(`/api/Testimonial/${id}`, { method: 'DELETE' })
}

export function deleteTestimonialsRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/Testimonial/range?${query.toString()}`, { method: 'DELETE' })
}
