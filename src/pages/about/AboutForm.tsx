import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getAbout, updateAbout, type AboutPayload } from '../../api/about'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './AboutForm.css'

interface TranslationFields {
  title: string
  description: string
  imageAltText: string
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang.code, { title: '', description: '', imageAltText: '' }]),
  )
}

export default function AboutForm() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
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

    return getAbout()
      .then((about) => {
        setExistingImageUrl(about.imageUrl)
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of about.translations) {
            next[translation.languageCode] = {
              title: translation.title,
              description: translation.description,
              imageAltText: translation.imageAltText ?? '',
            }
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

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null)
  }

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSavedMessage(null)

    const missing = SUPPORTED_LANGUAGES.find(
      (lang) => !translations[lang.code]?.title?.trim() || !translations[lang.code]?.description?.trim(),
    )
    if (missing) {
      setError(`"${missing.label}" dili üçün başlıq və mətn daxil edin`)
      setActiveTab(missing.code)
      return
    }

    const payload: AboutPayload = {
      imageFile,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        title: translations[lang.code].title.trim(),
        description: translations[lang.code].description.trim(),
        imageAltText: translations[lang.code].imageAltText.trim(),
      })),
    }

    setIsSaving(true)
    try {
      await updateAbout(payload)
      setImageFile(null)
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

  const previewUrl = imagePreviewUrl ?? resolveImageUrl(existingImageUrl)

  return (
    <div className="about-form-page">
      <h1>Haqqımızda</h1>

      <form className="about-form" onSubmit={handleSubmit}>
        <label className="about-form-field">
          <span>Şəkil</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {previewUrl && <img className="about-form-preview" src={previewUrl} alt="" />}

        <div className="about-form-tabs">
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

        {SUPPORTED_LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className="about-form-translation"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <label className="about-form-field">
              <span>Başlıq ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.title ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], title: e.target.value },
                  }))
                }
                placeholder={`Başlıq (${lang.label})`}
              />
            </label>

            <label className="about-form-field">
              <span>Mətn ({lang.label})</span>
              <textarea
                rows={8}
                value={translations[lang.code]?.description ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], description: e.target.value },
                  }))
                }
                placeholder={`Mətn (${lang.label})`}
              />
            </label>

            <label className="about-form-field">
              <span>Şəkil alt mətni ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.imageAltText ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], imageAltText: e.target.value },
                  }))
                }
                placeholder={`Şəklin alternativ mətni (${lang.label})`}
              />
            </label>
          </div>
        ))}

        {error && <div className="about-error">{error}</div>}
        {savedMessage && <div className="about-success">{savedMessage}</div>}

        <div className="about-form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Yadda saxlanılır…' : 'Yadda saxla'}
          </button>
        </div>
      </form>
    </div>
  )
}
