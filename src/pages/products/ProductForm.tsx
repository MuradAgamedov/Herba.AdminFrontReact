import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  getProduct,
  updateProduct,
  type ProductPayload,
} from '../../api/product'
import { listProductCategories, type ProductCategory } from '../../api/productCategory'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './ProductForm.css'

interface TranslationFields {
  name: string
  shortDescription: string
  description: string
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [lang.code, { name: '', shortDescription: '', description: '' }]),
  )
}

function useImagePreview(file: File | null): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return previewUrl
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [slug, setSlug] = useState('')
  const [productCategoryId, setProductCategoryId] = useState<number | ''>('')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [status, setStatus] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [hoverImageFile, setHoverImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingHoverImageUrl, setExistingHoverImageUrl] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, TranslationFields>>(
    emptyTranslations,
  )
  const [activeTab, setActiveTab] = useState(SUPPORTED_LANGUAGES[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imagePreviewUrl = useImagePreview(imageFile)
  const hoverImagePreviewUrl = useImagePreview(hoverImageFile)

  useEffect(() => {
    listProductCategories({ take: 100 }).then((result) => setCategories(result.items))
  }, [])

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getProduct(Number(id))
      .then((product) => {
        if (cancelled) return
        setSlug(product.slug)
        setProductCategoryId(product.productCategoryId)
        setStatus(product.status)
        setExistingImageUrl(product.imageUrl)
        setExistingHoverImageUrl(product.hoverImageUrl)
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of product.translations) {
            next[translation.languageCode] = {
              name: translation.name,
              shortDescription: translation.shortDescription,
              description: translation.description,
            }
          }
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Məhsul yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] ?? null)
  }

  function handleHoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    setHoverImageFile(event.target.files?.[0] ?? null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!slug.trim()) {
      setError('Slug daxil edin')
      return
    }
    if (!productCategoryId) {
      setError('Kateqoriya seçin')
      return
    }

    const requiredFields: { key: keyof TranslationFields; label: string }[] = [
      { key: 'name', label: 'ad' },
      { key: 'shortDescription', label: 'qısa təsvir' },
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

    const payload: ProductPayload = {
      slug: slug.trim(),
      productCategoryId: Number(productCategoryId),
      status,
      imageFile,
      hoverImageFile,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        name: translations[lang.code].name.trim(),
        shortDescription: translations[lang.code].shortDescription.trim(),
        description: translations[lang.code].description.trim(),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateProduct(Number(id), payload)
      } else {
        await createProduct(payload)
      }
      navigate('/products')
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
  const hoverPreviewUrl = hoverImagePreviewUrl ?? resolveImageUrl(existingHoverImageUrl)

  return (
    <div className="product-form-page">
      <h1>{isEdit ? 'Məhsulu redaktə et' : 'Yeni məhsul'}</h1>

      <form className="product-form" onSubmit={handleSubmit}>
        <div className="product-form-row">
          <label className="product-form-field">
            <span>Slug</span>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>

          <label className="product-form-field">
            <span>Kateqoriya</span>
            <select
              value={productCategoryId}
              onChange={(e) => setProductCategoryId(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">Seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.translations[0]?.name ?? `#${category.id}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="product-form-row">
          <label className="product-form-field">
            <span>Şəkil</span>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {previewUrl && <img className="product-form-preview" src={previewUrl} alt="" />}
          </label>

          <label className="product-form-field">
            <span>Hover şəkli</span>
            <input type="file" accept="image/*" onChange={handleHoverImageChange} />
            {hoverPreviewUrl && (
              <img className="product-form-preview" src={hoverPreviewUrl} alt="" />
            )}
          </label>
        </div>

        <div className="product-form-tabs">
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
            className="product-form-translation"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <label className="product-form-field">
              <span>Ad ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.name ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], name: e.target.value },
                  }))
                }
                placeholder={`Məhsul adı (${lang.label})`}
              />
            </label>

            <label className="product-form-field">
              <span>Qısa təsvir ({lang.label})</span>
              <textarea
                rows={3}
                value={translations[lang.code]?.shortDescription ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], shortDescription: e.target.value },
                  }))
                }
                placeholder={`Qısa təsvir (${lang.label})`}
              />
            </label>

            <label className="product-form-field">
              <span>Təsvir ({lang.label})</span>
              <textarea
                rows={6}
                value={translations[lang.code]?.description ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], description: e.target.value },
                  }))
                }
                placeholder={`Məhsul təsviri (${lang.label})`}
              />
            </label>
          </div>
        ))}

        <label className="product-form-checkbox">
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span>Aktiv</span>
        </label>

        {error && <div className="product-error">{error}</div>}

        <div className="product-form-actions">
          <button type="button" className="btn" onClick={() => navigate('/products')}>
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
