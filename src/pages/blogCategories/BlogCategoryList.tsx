import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteBlogCategory,
  listBlogCategories,
  type BlogCategory,
} from '../../api/blogCategory'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './BlogCategoryList.css'

const TAKE = 10

function translationFor(category: BlogCategory, languageCode: string): string {
  return category.translations.find((t) => t.languageCode === languageCode)?.name ?? '—'
}

export default function BlogCategoryList() {
  const [items, setItems] = useState<BlogCategory[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listBlogCategories({ search, page, take: TAKE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Kateqoriyalar yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page])

  async function handleDelete(id: number) {
    if (!confirm('Bu kateqoriyanı silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteBlogCategory(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Silinmə zamanı xəta baş verdi')
    }
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  return (
    <div className="category-list">
      <div className="category-list-header">
        <h1>Bloq Kateqoriyaları</h1>
        <Link to="/blogs/categories/new" className="btn btn-primary">
          + Yeni kateqoriya
        </Link>
      </div>

      <form className="category-search" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          placeholder="Axtar..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn">
          Axtar
        </button>
      </form>

      {error && <div className="category-error">{error}</div>}

      <div className="category-table-wrap">
        <table className="category-table">
          <thead>
            <tr>
              <th>Sıra</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Ad ({lang.label})</th>
              ))}
              <th>Status</th>
              <th aria-label="Əməliyyatlar" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 3}>Yüklənir…</td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 3}>Nəticə tapılmadı</td>
              </tr>
            )}

            {!isLoading &&
              items.map((category) => (
                <tr key={category.id}>
                  <td>{category.order}</td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(category, lang.code)}</td>
                  ))}
                  <td>
                    <span className={`badge ${category.status ? 'badge-active' : 'badge-inactive'}`}>
                      {category.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="category-actions">
                    <Link to={`/blogs/categories/${category.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(category.id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="category-pagination">
          <button
            type="button"
            className="btn btn-small"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Əvvəlki
          </button>
          <span>
            Səhifə {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Növbəti
          </button>
        </div>
      )}
    </div>
  )
}
