export interface SupportedLanguage {
  code: string
  label: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  az: 'Azərbaycan',
  en: 'English',
  ru: 'Русский',
  tr: 'Türkçe',
}

function parseSupportedLanguages(): SupportedLanguage[] {
  const raw = import.meta.env.VITE_SUPPORTED_LANGUAGES as string | undefined
  const codes = (raw ?? 'az,en').split(',').map((code) => code.trim()).filter(Boolean)

  return codes.map((code) => ({
    code,
    label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
  }))
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = parseSupportedLanguages()
