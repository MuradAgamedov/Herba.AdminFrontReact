import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProductCategory,
  getProductCategory,
  updateProductCategory,
  type ProductCategoryPayload,
} from '../../api/productCategory'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './ProductCategoryForm.css'

function emptyNamesByLanguage(): Record<string, string> {
  return Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang.code, '']))
}

export default function ProductCategoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')
  const [status, setStatus] = useState(true)
  const [namesByLanguage, setNamesByLanguage] = useState<Record<string, string>>(
    emptyNamesByLanguage,
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

    getProductCategory(Number(id))
      .then((category) => {
        if (cancelled) return
        setSlug(category.slug)
        setIcon(category.icon ?? '')
        setStatus(category.status)
        setNamesByLanguage((prev) => {
          const next = { ...prev }
          for (const translation of category.translations) {
            next[translation.languageCode] = translation.name
          }
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Kateqoriya yüklənmədi')
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

    if (!slug.trim()) {
      setError('Slug daxil edin')
      return
    }

    const missing = SUPPORTED_LANGUAGES.find((lang) => !namesByLanguage[lang.code]?.trim())
    if (missing) {
      setError(`"${missing.label}" dili üçün ad daxil edin`)
      setActiveTab(missing.code)
      return
    }

    const payload: ProductCategoryPayload = {
      slug: slug.trim(),
      icon: icon.trim(),
      status,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        name: namesByLanguage[lang.code].trim(),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateProductCategory(Number(id), payload)
      } else {
        await createProductCategory(payload)
      }
      navigate('/products/categories')
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
    <div className="product-category-form-page">
      <h1>{isEdit ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}</h1>

      <form className="product-category-form" onSubmit={handleSubmit}>
        <div className="product-category-form-row">
          <label className="product-category-form-field">
            <span>Slug</span>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>

          <label className="product-category-form-field">
            <span>İkon</span>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="ikon adı və ya URL"
            />
          </label>
        </div>

        <div className="product-category-form-tabs">
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
          <label
            key={lang.code}
            className="product-category-form-field"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <span>Ad ({lang.label})</span>
            <input
              type="text"
              value={namesByLanguage[lang.code] ?? ''}
              onChange={(e) =>
                setNamesByLanguage((prev) => ({ ...prev, [lang.code]: e.target.value }))
              }
              placeholder={`Kateqoriya adı (${lang.label})`}
            />
          </label>
        ))}

        <label className="product-category-form-checkbox">
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span>Aktiv</span>
        </label>

        {error && <div className="product-category-error">{error}</div>}

        <div className="product-category-form-actions">
          <button type="button" className="btn" onClick={() => navigate('/products/categories')}>
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
