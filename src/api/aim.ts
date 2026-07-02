import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface AimTranslation {
  id?: number
  title: string
  description: string
  iconAltText: string | null
  languageCode: string
  aimId?: number
}

export interface Aim {
  id: number
  iconUrl: string | null
  status: boolean
  translations: AimTranslation[]
}

export interface AimListParams {
  search?: string
  page?: number
  take?: number
}

export interface AimTranslationInput {
  languageCode: string
  title: string
  description: string
  iconAltText: string
}

export interface AimPayload {
  status: boolean
  iconFile?: File | null
  translations: AimTranslationInput[]
}

function buildAimFormData(payload: AimPayload): FormData {
  const formData = new FormData()
  formData.append('Status', String(payload.status))
  if (payload.iconFile) {
    formData.append('IconFile', payload.iconFile)
  }
  payload.translations.forEach((translation, index) => {
    formData.append(`Translations[${index}].LanguageCode`, translation.languageCode)
    formData.append(`Translations[${index}].Title`, translation.title)
    formData.append(`Translations[${index}].Description`, translation.description)
    formData.append(`Translations[${index}].IconAltText`, translation.iconAltText)
  })
  return formData
}

export function listAims(params: AimListParams = {}): Promise<PagedResult<Aim>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<Aim>>(`/api/Aim${qs ? `?${qs}` : ''}`)
}

export function getAim(id: number): Promise<Aim> {
  return apiFetch<Aim>(`/api/Aim/${id}`)
}

export function createAim(payload: AimPayload): Promise<Aim> {
  return apiFetch<Aim>('/api/Aim', {
    method: 'POST',
    body: buildAimFormData(payload),
  })
}

export function updateAim(id: number, payload: AimPayload): Promise<Aim> {
  return apiFetch<Aim>(`/api/Aim/${id}`, {
    method: 'PUT',
    body: buildAimFormData(payload),
  })
}

export function deleteAim(id: number): Promise<void> {
  return apiFetch<void>(`/api/Aim/${id}`, { method: 'DELETE' })
}

export function deleteAimsRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/Aim/range?${query.toString()}`, { method: 'DELETE' })
}
