import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteProductCategory,
  listProductCategories,
  type ProductCategory,
} from '../../api/productCategory'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './ProductCategoryList.css'

const TAKE = 10

function translationFor(category: ProductCategory, languageCode: string): string {
  return category.translations.find((t) => t.languageCode === languageCode)?.name ?? '—'
}

export default function ProductCategoryList() {
  const [items, setItems] = useState<ProductCategory[]>([])
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

    listProductCategories({ search, page, take: TAKE })
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
      await deleteProductCategory(id)
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
    <div className="product-category-list">
      <div className="product-category-list-header">
        <h1>Məhsul Kateqoriyaları</h1>
        <Link to="/products/categories/new" className="btn btn-primary">
          + Yeni kateqoriya
        </Link>
      </div>

      <form className="product-category-search" onSubmit={handleSearchSubmit}>
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

      {error && <div className="product-category-error">{error}</div>}

      <div className="product-category-table-wrap">
        <table className="product-category-table">
          <thead>
            <tr>
              <th>İkon</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Ad ({lang.label})</th>
              ))}
              <th>Slug</th>
              <th>Status</th>
              <th aria-label="Əməliyyatlar" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 4}>Yüklənir…</td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 4}>Nəticə tapılmadı</td>
              </tr>
            )}

            {!isLoading &&
              items.map((category) => (
                <tr key={category.id}>
                  <td>{category.icon || '—'}</td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(category, lang.code)}</td>
                  ))}
                  <td>{category.slug}</td>
                  <td>
                    <span className={`badge ${category.status ? 'badge-active' : 'badge-inactive'}`}>
                      {category.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="product-category-actions">
                    <Link to={`/products/categories/${category.id}/edit`} className="btn btn-small">
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
        <div className="product-category-pagination">
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
