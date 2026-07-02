import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAim, getAim, updateAim, type AimPayload } from '../../api/aim'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './AimForm.css'

interface TranslationFields {
  title: string
  description: string
  iconAltText: string
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang.code, { title: '', description: '', iconAltText: '' }]),
  )
}

export default function AimForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [status, setStatus] = useState(true)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null)
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, TranslationFields>>(
    emptyTranslations,
  )
  const [activeTab, setActiveTab] = useState(SUPPORTED_LANGUAGES[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getAim(Number(id))
      .then((aim) => {
        if (cancelled) return
        setStatus(aim.status)
        setExistingIconUrl(aim.iconUrl)
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of aim.translations) {
            next[translation.languageCode] = {
              title: translation.title,
              description: translation.description,
              iconAltText: translation.iconAltText ?? '',
            }
          }
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Məqsəd yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    setIconFile(event.target.files?.[0] ?? null)
  }

  useEffect(() => {
    if (!iconFile) {
      setIconPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(iconFile)
    setIconPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [iconFile])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const requiredFields: { key: keyof TranslationFields; label: string }[] = [
      { key: 'title', label: 'başlıq' },
      { key: 'description', label: 'təsvir' },
    ]

    for (const lang of SUPPORTED_LANGUAGES) {
      const missingField = requiredFields.find((field) => !translations[lang.code]?.[field.key]?.trim())
      if (missingField) {
        setError(`"${lang.label}" dili üçün ${missingField.label} daxil edin`)
        setActiveTab(lang.code)
        return
      }
    }

    const payload: AimPayload = {
      status,
      iconFile,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        title: translations[lang.code].title.trim(),
        description: translations[lang.code].description.trim(),
        iconAltText: translations[lang.code].iconAltText.trim(),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateAim(Number(id), payload)
      } else {
        await createAim(payload)
      }
      navigate('/aims')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Yadda saxlanılmadı')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p>Yüklənir…</p>
  }

  const previewUrl = iconPreviewUrl ?? resolveImageUrl(existingIconUrl)

  return (
    <div className="aim-form-page">
      <h1>{isEdit ? 'Məqsədi redaktə et' : 'Yeni məqsəd'}</h1>

      <form className="aim-form" onSubmit={handleSubmit}>
        <label className="aim-form-field">
          <span>İkon</span>
          <input type="file" accept="image/*" onChange={handleIconChange} />
        </label>

        {previewUrl && <img className="aim-form-preview" src={previewUrl} alt="" />}

        <div className="aim-form-tabs">
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
            className="aim-form-translation"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <label className="aim-form-field">
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

            <label className="aim-form-field">
              <span>Təsvir ({lang.label})</span>
              <textarea
                rows={5}
                value={translations[lang.code]?.description ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], description: e.target.value },
                  }))
                }
                placeholder={`Təsvir (${lang.label})`}
              />
            </label>

            <label className="aim-form-field">
              <span>İkon alt mətni ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.iconAltText ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], iconAltText: e.target.value },
                  }))
                }
                placeholder={`İkonun alternativ mətni (${lang.label})`}
              />
            </label>
          </div>
        ))}

        <label className="aim-form-checkbox">
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span>Aktiv</span>
        </label>

        {error && <div className="aim-error">{error}</div>}

        <div className="aim-form-actions">
          <button type="button" className="btn" onClick={() => navigate('/aims')}>
            Ləğv et
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Yadda saxlanılır…' : 'Yadda saxla'}
          </button>
        </div>
      </form>
    </div>
  )
}
