import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createTestimonial,
  getTestimonial,
  updateTestimonial,
  type TestimonialPayload,
} from '../../api/testimonial'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './TestimonialForm.css'

interface TranslationFields {
  quote: string
  role: string
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang.code, { quote: '', role: '' }]))
}

export default function TestimonialForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(5)
  const [status, setStatus] = useState(true)
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

    getTestimonial(Number(id))
      .then((testimonial) => {
        if (cancelled) return
        setCustomerName(testimonial.customerName)
        setRating(testimonial.rating)
        setStatus(testimonial.status)
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of testimonial.translations) {
            next[translation.languageCode] = {
              quote: translation.quote,
              role: translation.role,
            }
          }
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Rəy yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!customerName.trim()) {
      setError('Müştəri adını daxil edin')
      return
    }

    const requiredFields: { key: keyof TranslationFields; label: string }[] = [
      { key: 'quote', label: 'rəy mətni' },
      { key: 'role', label: 'vəzifə' },
    ]

    for (const lang of SUPPORTED_LANGUAGES) {
      const missingField = requiredFields.find((field) => !translations[lang.code]?.[field.key]?.trim())
      if (missingField) {
        setError(`"${lang.label}" dili üçün ${missingField.label} daxil edin`)
        setActiveTab(lang.code)
        return
      }
    }

    const payload: TestimonialPayload = {
      customerName: customerName.trim(),
      rating,
      status,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        quote: translations[lang.code].quote.trim(),
        role: translations[lang.code].role.trim(),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateTestimonial(Number(id), payload)
      } else {
        await createTestimonial(payload)
      }
      navigate('/testimonials')
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
    <div className="testimonial-form-page">
      <h1>{isEdit ? 'Rəyi redaktə et' : 'Yeni rəy'}</h1>

      <form className="testimonial-form" onSubmit={handleSubmit}>
        <div className="testimonial-form-row">
          <label className="testimonial-form-field">
            <span>Müştəri adı</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </label>

          <label className="testimonial-form-field">
            <span>Reytinq</span>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="testimonial-form-tabs">
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
            className="testimonial-form-translation"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <label className="testimonial-form-field">
              <span>Vəzifə ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.role ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], role: e.target.value },
                  }))
                }
                placeholder={`Müştərinin vəzifəsi (${lang.label})`}
              />
            </label>

            <label className="testimonial-form-field">
              <span>Rəy mətni ({lang.label})</span>
              <textarea
                rows={5}
                value={translations[lang.code]?.quote ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], quote: e.target.value },
                  }))
                }
                placeholder={`Rəy mətni (${lang.label})`}
              />
            </label>
          </div>
        ))}

        <label className="testimonial-form-checkbox">
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span>Aktiv</span>
        </label>

        {error && <div className="testimonial-error">{error}</div>}

        <div className="testimonial-form-actions">
          <button type="button" className="btn" onClick={() => navigate('/testimonials')}>
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
