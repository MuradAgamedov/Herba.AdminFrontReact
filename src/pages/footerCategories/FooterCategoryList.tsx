import { useEffect, useState, type FormEvent } from 'react'
import {
  createFooterCategory,
  deleteFooterCategory,
  listFooterCategories,
} from '../../api/footerCategory'
import { getBlogCategory, listBlogCategories, type BlogCategory } from '../../api/blogCategory'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './FooterCategoryList.css'

interface FooterRow {
  footerId: number
  category: BlogCategory | null
}

function nameFor(category: BlogCategory): string {
  return (
    category.translations.find((t) => t.languageCode === SUPPORTED_LANGUAGES[0]?.code)?.name ??
    category.translations[0]?.name ??
    `#${category.id}`
  )
}

export default function FooterCategoryList() {
  const [footerItems, setFooterItems] = useState<FooterRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<BlogCategory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  function loadFooterItems() {
    setIsLoading(true)
    setError(null)

    listFooterCategories({ take: 100 })
      .then(async (result) => {
        const rows = await Promise.all(
          result.items.map(async (item) => {
            try {
              const category = await getBlogCategory(item.blogCategoryId)
              return { footerId: item.id, category }
            } catch {
              return { footerId: item.id, category: null }
            }
          }),
        )
        setFooterItems(rows)
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Footer kateqoriyaları yüklənmədi')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadFooterItems()
  }, [])

  async function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    if (!searchInput.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const result = await listBlogCategories({ search: searchInput.trim(), take: 20 })
      setSearchResults(result.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Axtarış zamanı xəta baş verdi')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleAdd(blogCategoryId: number) {
    setAddingId(blogCategoryId)
    setError(null)
    try {
      await createFooterCategory(blogCategoryId)
      loadFooterItems()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Əlavə edilmədi')
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(footerId: number) {
    if (!confirm('Bu kateqoriyanı footer-dən çıxarmaq istədiyinizə əminsiniz?')) return

    try {
      await deleteFooterCategory(footerId)
      setFooterItems((prev) => prev.filter((row) => row.footerId !== footerId))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Silinmə zamanı xəta baş verdi')
    }
  }

  const footerCategoryIds = new Set(footerItems.map((row) => row.category?.id).filter(Boolean))

  return (
    <div className="footer-category-page">
      <h1>Footer Kateqoriyaları</h1>

      {error && <div className="footer-category-error">{error}</div>}

      <section className="footer-category-search-section">
        <h2>Bloq kateqoriyası axtar</h2>
        <form className="footer-category-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Kateqoriya adı ilə axtar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isSearching}>
            {isSearching ? 'Axtarılır…' : 'Axtar'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="footer-category-results">
            {searchResults.map((category) => {
              const isAdded = footerCategoryIds.has(category.id)
              return (
                <li key={category.id} className="footer-category-result">
                  <span className="footer-category-name">{nameFor(category)}</span>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    disabled={isAdded || addingId === category.id}
                    onClick={() => handleAdd(category.id)}
                  >
                    {isAdded
                      ? 'Artıq əlavə edilib'
                      : addingId === category.id
                        ? 'Əlavə edilir…'
                        : 'Əlavə et'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="footer-category-list-section">
        <h2>Hazırkı footer kateqoriyaları</h2>

        {isLoading && <p>Yüklənir…</p>}

        {!isLoading && footerItems.length === 0 && <p>Hələ footer kateqoriyası yoxdur</p>}

        {!isLoading && footerItems.length > 0 && (
          <ul className="footer-category-results">
            {footerItems.map((row) => (
              <li key={row.footerId} className="footer-category-result">
                <span className="footer-category-name">
                  {row.category ? nameFor(row.category) : `#${row.footerId}`}
                </span>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => handleRemove(row.footerId)}
                >
                  Çıxar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
