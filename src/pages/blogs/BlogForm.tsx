import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBlog, getBlog, updateBlog, type BlogPayload } from '../../api/blog'
import { listBlogCategories, type BlogCategory } from '../../api/blogCategory'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './BlogForm.css'

interface TranslationFields {
  title: string
  author: string
  shortDescription: string
  description: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  imageAltText: string
}

function emptyTranslations(): Record<string, TranslationFields> {
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((lang) => [
      lang.code,
      {
        title: '',
        author: '',
        shortDescription: '',
        description: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        imageAltText: '',
      },
    ]),
  )
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function BlogForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [slug, setSlug] = useState('')
  const [blogCategoryId, setBlogCategoryId] = useState<number | ''>('')
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [readMinutes, setReadMinutes] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [status, setStatus] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<string, TranslationFields>>(
    emptyTranslations,
  )
  const [activeTab, setActiveTab] = useState(SUPPORTED_LANGUAGES[0]?.code ?? '')
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listBlogCategories({ take: 100 }).then((result) => setCategories(result.items))
  }, [])

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getBlog(Number(id))
      .then((blog) => {
        if (cancelled) return
        setSlug(blog.slug)
        setBlogCategoryId(blog.blogCategoryId)
        setReadMinutes(blog.readMinutes != null ? String(blog.readMinutes) : '')
        setPublishedAt(toDatetimeLocal(blog.publishedAt))
        setStatus(blog.status)
        setExistingImageUrl(blog.imageUrl)
        setTranslations((prev) => {
          const next = { ...prev }
          for (const translation of blog.translations) {
            next[translation.languageCode] = {
              title: translation.title,
              author: translation.author,
              shortDescription: translation.shortDescription,
              description: translation.description,
              seoTitle: translation.seoTitle ?? '',
              seoDescription: translation.seoDescription ?? '',
              seoKeywords: translation.seoKeywords ?? '',
              imageAltText: translation.imageAltText ?? '',
            }
          }
          return next
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Bloq yüklənmədi')
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

    if (!slug.trim()) {
      setError('Slug daxil edin')
      return
    }
    if (!blogCategoryId) {
      setError('Kateqoriya seçin')
      return
    }
    if (!publishedAt) {
      setError('Nəşr tarixini seçin')
      return
    }

    const requiredFields: { key: keyof TranslationFields; label: string }[] = [
      { key: 'title', label: 'başlıq' },
      { key: 'author', label: 'müəllif' },
      { key: 'shortDescription', label: 'qısa təsvir' },
      { key: 'description', label: 'məzmun' },
    ]

    for (const lang of SUPPORTED_LANGUAGES) {
      const missingField = requiredFields.find((field) => !translations[lang.code]?.[field.key]?.trim())
      if (missingField) {
        setError(`"${lang.label}" dili üçün ${missingField.label} daxil edin`)
        setActiveTab(lang.code)
        return
      }
    }

    const payload: BlogPayload = {
      slug: slug.trim(),
      blogCategoryId: Number(blogCategoryId),
      readMinutes: readMinutes ? Number(readMinutes) : undefined,
      publishedAt,
      status,
      imageFile,
      translations: SUPPORTED_LANGUAGES.map((lang) => ({
        languageCode: lang.code,
        title: translations[lang.code].title.trim(),
        author: translations[lang.code].author.trim(),
        shortDescription: translations[lang.code].shortDescription.trim(),
        description: translations[lang.code].description.trim(),
        seoTitle: translations[lang.code].seoTitle.trim(),
        seoDescription: translations[lang.code].seoDescription.trim(),
        seoKeywords: translations[lang.code].seoKeywords.trim(),
        imageAltText: translations[lang.code].imageAltText.trim(),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit) {
        await updateBlog(Number(id), payload)
      } else {
        await createBlog(payload)
      }
      navigate('/blogs')
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
    <div className="blog-form-page">
      <h1>{isEdit ? 'Bloqu redaktə et' : 'Yeni bloq'}</h1>

      <form className="blog-form" onSubmit={handleSubmit}>
        <div className="blog-form-row">
          <label className="blog-form-field">
            <span>Slug</span>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </label>

          <label className="blog-form-field">
            <span>Kateqoriya</span>
            <select
              value={blogCategoryId}
              onChange={(e) => setBlogCategoryId(e.target.value ? Number(e.target.value) : '')}
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

        <div className="blog-form-row">
          <label className="blog-form-field">
            <span>Oxu müddəti (dəqiqə)</span>
            <input
              type="number"
              min="0"
              value={readMinutes}
              onChange={(e) => setReadMinutes(e.target.value)}
            />
          </label>
        </div>

        <label className="blog-form-field">
          <span>Nəşr tarixi</span>
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            required
          />
        </label>

        <label className="blog-form-field">
          <span>Şəkil</span>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>

        {previewUrl && <img className="blog-form-preview" src={previewUrl} alt="" />}

        <div className="blog-form-tabs">
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
            className="blog-form-translation"
            style={{ display: activeTab === lang.code ? 'flex' : 'none' }}
          >
            <label className="blog-form-field">
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
                placeholder={`Bloq başlığı (${lang.label})`}
              />
            </label>

            <label className="blog-form-field">
              <span>Müəllif ({lang.label})</span>
              <input
                type="text"
                value={translations[lang.code]?.author ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], author: e.target.value },
                  }))
                }
                placeholder={`Müəllif adı (${lang.label})`}
              />
            </label>

            <label className="blog-form-field">
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

            <label className="blog-form-field">
              <span>Məzmun ({lang.label})</span>
              <textarea
                rows={8}
                value={translations[lang.code]?.description ?? ''}
                onChange={(e) =>
                  setTranslations((prev) => ({
                    ...prev,
                    [lang.code]: { ...prev[lang.code], description: e.target.value },
                  }))
                }
                placeholder={`Bloq məzmunu (${lang.label})`}
              />
            </label>

            <div className="blog-form-seo">
              <h2>SEO ({lang.label})</h2>

              <label className="blog-form-field">
                <span>SEO başlıq</span>
                <input
                  type="text"
                  value={translations[lang.code]?.seoTitle ?? ''}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [lang.code]: { ...prev[lang.code], seoTitle: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="blog-form-field">
                <span>SEO təsvir</span>
                <textarea
                  rows={2}
                  value={translations[lang.code]?.seoDescription ?? ''}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [lang.code]: { ...prev[lang.code], seoDescription: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="blog-form-field">
                <span>SEO açar sözlər</span>
                <input
                  type="text"
                  value={translations[lang.code]?.seoKeywords ?? ''}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [lang.code]: { ...prev[lang.code], seoKeywords: e.target.value },
                    }))
                  }
                  placeholder="açar, söz, vergüllə ayrılmış"
                />
              </label>

              <label className="blog-form-field">
                <span>Şəkil alt mətni</span>
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
          </div>
        ))}

        <label className="blog-form-checkbox">
          <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} />
          <span>Aktiv</span>
        </label>

        {error && <div className="blog-error">{error}</div>}

        <div className="blog-form-actions">
          <button type="button" className="btn" onClick={() => navigate('/blogs')}>
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
