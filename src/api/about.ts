import { apiFetch } from './client'

export interface AboutTranslation {
  id?: number
  title: string
  description: string
  imageAltText: string | null
  languageCode: string
  aboutId?: number
}

export interface About {
  id: number
  imageUrl: string | null
  translations: AboutTranslation[]
}

export interface AboutTranslationInput {
  languageCode: string
  title: string
  description: string
  imageAltText: string
}

export interface AboutPayload {
  imageFile?: File | null
  translations: AboutTranslationInput[]
}

function buildAboutFormData(payload: AboutPayload): FormData {
  const formData = new FormData()
  if (payload.imageFile) {
    formData.append('ImageFile', payload.imageFile)
  }
  payload.translations.forEach((translation, index) => {
    formData.append(`Translations[${index}].LanguageCode`, translation.languageCode)
    formData.append(`Translations[${index}].Title`, translation.title)
    formData.append(`Translations[${index}].Description`, translation.description)
    formData.append(`Translations[${index}].ImageAltText`, translation.imageAltText)
  })
  return formData
}

export function getAbout(): Promise<About> {
  return apiFetch<About>('/api/About')
}

export function updateAbout(payload: AboutPayload): Promise<About> {
  return apiFetch<About>('/api/About', {
    method: 'PUT',
    body: buildAboutFormData(payload),
  })
}
