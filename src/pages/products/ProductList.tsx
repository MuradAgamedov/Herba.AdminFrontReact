import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteProduct, listProducts, type Product } from '../../api/product'
import { listProductCategories, type ProductCategory } from '../../api/productCategory'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './ProductList.css'

const TAKE = 10

function translationFor(product: Product, languageCode: string): string {
  return product.translations.find((t) => t.languageCode === languageCode)?.name ?? '—'
}

export default function ProductList() {
  const [items, setItems] = useState<Product[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProductCategories({ take: 100 }).then((result) => setCategories(result.items))
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listProducts({ search, page, take: TAKE, productCategoryId: categoryFilter || undefined })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Məhsullar yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page, categoryFilter])

  function categoryNameFor(id: number): string {
    return categories.find((c) => c.id === id)?.translations[0]?.name ?? `#${id}`
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteProduct(id)
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
    <div className="product-list">
      <div className="product-list-header">
        <h1>Məhsullar</h1>
        <Link to="/products/new" className="btn btn-primary">
          + Yeni məhsul
        </Link>
      </div>

      <div className="product-filters">
        <form className="product-search" onSubmit={handleSearchSubmit}>
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

        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(1)
            setCategoryFilter(e.target.value ? Number(e.target.value) : '')
          }}
        >
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.translations[0]?.name ?? `#${category.id}`}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="product-error">{error}</div>}

      <div className="product-table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>Şəkil</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Ad ({lang.label})</th>
              ))}
              <th>Slug</th>
              <th>Kateqoriya</th>
              <th>Status</th>
              <th aria-label="Əməliyyatlar" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 5}>Yüklənir…</td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 5}>Nəticə tapılmadı</td>
              </tr>
            )}

            {!isLoading &&
              items.map((product) => (
                <tr key={product.id}>
                  <td>
                    {resolveImageUrl(product.imageUrl) ? (
                      <img
                        className="product-thumb"
                        src={resolveImageUrl(product.imageUrl) ?? undefined}
                        alt=""
                      />
                    ) : (
                      <div className="product-thumb product-thumb-empty" />
                    )}
                  </td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(product, lang.code)}</td>
                  ))}
                  <td>{product.slug}</td>
                  <td>{categoryNameFor(product.productCategoryId)}</td>
                  <td>
                    <span
                      className={`badge ${product.status ? 'badge-active' : 'badge-inactive'}`}
                    >
                      {product.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="product-actions">
                    <Link to={`/products/${product.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(product.id)}
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
        <div className="product-pagination">
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
