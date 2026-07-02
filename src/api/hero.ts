import { apiFetch } from './client'

export interface HeroTranslation {
  id?: number
  badge: string
  title: string
  description: string
  primaryButtonText: string
  secondaryButtonText: string
  trustBadge1: string
  trustBadge2: string
  trustBadge3: string
  sampleResultTitle: string
  stat1Label: string
  stat1Value: string
  stat2Label: string
  stat2Value: string
  stat3Label: string
  stat3Value: string
  recommendationText: string
  languageCode: string
  heroId?: number
}

export interface Hero {
  id?: number
  translations: HeroTranslation[]
}

export type HeroTranslationInput = Omit<HeroTranslation, 'id' | 'heroId'>

export interface HeroPayload {
  translations: HeroTranslationInput[]
}

export function getHero(): Promise<Hero> {
  return apiFetch<Hero>('/api/Hero')
}

export function updateHero(payload: HeroPayload): Promise<Hero> {
  return apiFetch<Hero>('/api/Hero', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
