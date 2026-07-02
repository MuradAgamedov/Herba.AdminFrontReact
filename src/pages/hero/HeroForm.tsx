import { useEffect, useState, type FormEvent } from 'react'
import { getHero, updateHero, type HeroTranslationInput } from '../../api/hero'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './HeroForm.css'

type TranslationFields = Omit<HeroTranslationInput, 'languageCode'>

const FIELD_LABELS: Record<keyof TranslationFields, string> = {
  badge: 'Nişan (badge)',
  title: 'Başlıq',
  description: 'Təsvir',
  primaryButtonText: 'Əsas düymə mətni',
  secondaryButtonText: 'İkinci düymə mətni',
  trustBadge1: 'Etibar nişanı 1',
  trustBadge2: 'Etibar nişanı 2',
  trustBadge3: 'Etibar nişanı 3',
  sampleResultTitle: 'Nümunə nəticə başlığı',
  stat1Label: 'Statistika 1 etiketi',
  stat1Value: 'Statistika 1 dəyəri',
  stat2Label: 'Statistika 2 etiketi',
  stat2Value: 'Statistika 2 dəyəri',
  stat3Label: 'Statistika 3 etiketi',
  stat3Value: 'Statistika 3 dəyəri',
  recommendationText: 'Tövsiyə mətni',
}

function emptyFields(): TranslationFields {
  return {
    badge: '',
    title: '',
    description: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    trustBadge1: '',
    trustBadge2: '',
    trustBadge3: '',
    sampleResultTitle: '',
    stat1Label: '',
    stat1Value: '',
    stat2Label: '',
    stat2Value: '',
    stat3Label: '',
    stat3Value: '',
    recommendationText: '',
  }
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang.code, emptyFields()]))
}

const LONG_FIELDS = new Set<keyof TranslationFields>(['description', 'recommendationText'])

function Field({
  name,
  value,
  onChange,
}: {
  name: keyof TranslationFields
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="hero-form-field">
      <span>{FIELD_LABELS[name]}</span>
      {LONG_FIELDS.has(name) ? (
        <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

export default function HeroForm() {
  const [translations, setTranslations] = useState<Record<string, TranslationFields>>(
    emptyTranslations,
  )
  const [activeTab, setActiveTab] = useState(SUPPORTED_LANGUAGES[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  function load() {
    setIsLoading(true)
    setError(null)

    return getHero()
      .then((hero) => {
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of hero.translations) {
            const { languageCode: _languageCode, id: _id, heroId: _heroId, ...fields } = translation
            next[translation.languageCode] = fields
          }
          return next
        })
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Məlumat yüklənmədi')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function updateField(languageCode: string, key: keyof TranslationFields, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: { ...prev[languageCode], [key]: value },
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSavedMessage(null)

    const missing = SUPPORTED_LANGUAGES.find(
      (lang) => !translations[lang.code]?.title?.trim() || !translations[lang.code]?.description?.trim(),
    )
    if (missing) {
      setError(`"${missing.label}" dili üçün başlıq və təsvir daxil edin`)
      setActiveTab(missing.code)
      return
    }

    setIsSaving(true)
    try {
      await updateHero({
        translations: SUPPORTED_LANGUAGES.map((lang) => ({
          languageCode: lang.code,
          ...translations[lang.code],
        })),
      })
      await load()
      setSavedMessage('Yadda saxlanıldı')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yadda saxlanılmadı')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p>Yüklənir…</p>
  }

  return (
    <div className="hero-form-page">
      <h1>Hero</h1>

      <form className="hero-form" onSubmit={handleSubmit}>
        <div className="hero-form-tabs">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={activeTab === lang.code ? 'active' : ''}
              onClick={() => setActiveTab(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {SUPPORTED_LANGUAGES.map((lang) => {
          const field = (name: keyof TranslationFields) => ({
            name,
            value: translations[lang.code]?.[name] ?? '',
            onChange: (value: string) => updateField(lang.code, name, value),
          })

          return (
            <div
              key={lang.code}
              className="hero-form-translation"
              style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
            >
              <div className="hero-form-section">
                <h2>Əsas məlumat</h2>
                <Field {...field('badge')} />
                <Field {...field('title')} />
                <Field {...field('description')} />
                <div className="hero-form-row">
                  <Field {...field('primaryButtonText')} />
                  <Field {...field('secondaryButtonText')} />
                </div>
              </div>

              <div className="hero-form-section">
                <h2>Etibar nişanları</h2>
                <div className="hero-form-row">
                  <Field {...field('trustBadge1')} />
                  <Field {...field('trustBadge2')} />
                  <Field {...field('trustBadge3')} />
                </div>
              </div>

              <div className="hero-form-section">
                <h2>Nümunə nəticə</h2>
                <Field {...field('sampleResultTitle')} />
                <div className="hero-form-row">
                  <Field {...field('stat1Label')} />
                  <Field {...field('stat1Value')} />
                </div>
                <div className="hero-form-row">
                  <Field {...field('stat2Label')} />
                  <Field {...field('stat2Value')} />
                </div>
                <div className="hero-form-row">
                  <Field {...field('stat3Label')} />
                  <Field {...field('stat3Value')} />
                </div>
              </div>

              <div className="hero-form-section">
                <h2>Tövsiyə</h2>
                <Field {...field('recommendationText')} />
              </div>
            </div>
          )
        })}

        {error && <div className="hero-error">{error}</div>}
        {savedMessage && <div className="hero-success">{savedMessage}</div>}

        <div className="hero-form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Yadda saxlanılır…' : 'Yadda saxla'}
          </button>
        </div>
      </form>
    </div>
  )
}
