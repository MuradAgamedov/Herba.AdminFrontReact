import { apiFetch } from './client'
import type { PagedResult } from './blogCategory'

export interface AnalysisTranslation {
  id?: number
  title: string
  description: string
  buttonText: string
  iconAltText: string | null
  languageCode: string
  analysisId?: number
}

export interface Analysis {
  id: number
  url: string
  iconUrl: string | null
  status: boolean
  translations: AnalysisTranslation[]
}

export interface AnalysisListParams {
  search?: string
  page?: number
  take?: number
}

export interface AnalysisTranslationInput {
  languageCode: string
  title: string
  description: string
  buttonText: string
  iconAltText: string
}

export interface AnalysisPayload {
  url: string
  status: boolean
  iconFile?: File | null
  translations: AnalysisTranslationInput[]
}

function buildAnalysisFormData(payload: AnalysisPayload): FormData {
  const formData = new FormData()
  formData.append('Url', payload.url)
  formData.append('Status', String(payload.status))
  if (payload.iconFile) {
    formData.append('IconFile', payload.iconFile)
  }
  payload.translations.forEach((translation, index) => {
    formData.append(`Translations[${index}].LanguageCode`, translation.languageCode)
    formData.append(`Translations[${index}].Title`, translation.title)
    formData.append(`Translations[${index}].Description`, translation.description)
    formData.append(`Translations[${index}].ButtonText`, translation.buttonText)
    formData.append(`Translations[${index}].IconAltText`, translation.iconAltText)
  })
  return formData
}

export function listAnalyses(params: AnalysisListParams = {}): Promise<PagedResult<Analysis>> {
  const query = new URLSearchParams()
  if (params.search) query.set('Search', params.search)
  if (params.page) query.set('Page', String(params.page))
  if (params.take) query.set('Take', String(params.take))

  const qs = query.toString()
  return apiFetch<PagedResult<Analysis>>(`/api/Analysis${qs ? `?${qs}` : ''}`)
}

export function getAnalysis(id: number): Promise<Analysis> {
  return apiFetch<Analysis>(`/api/Analysis/${id}`)
}

export function createAnalysis(payload: AnalysisPayload): Promise<Analysis> {
  return apiFetch<Analysis>('/api/Analysis', {
    method: 'POST',
    body: buildAnalysisFormData(payload),
  })
}

export function updateAnalysis(id: number, payload: AnalysisPayload): Promise<Analysis> {
  return apiFetch<Analysis>(`/api/Analysis/${id}`, {
    method: 'PUT',
    body: buildAnalysisFormData(payload),
  })
}

export function deleteAnalysis(id: number): Promise<void> {
  return apiFetch<void>(`/api/Analysis/${id}`, { method: 'DELETE' })
}

export function deleteAnalysesRange(ids: number[]): Promise<void> {
  const query = new URLSearchParams()
  ids.forEach((id) => query.append('ids', String(id)))
  return apiFetch<void>(`/api/Analysis/range?${query.toString()}`, { method: 'DELETE' })
}
