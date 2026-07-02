import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteBlog, listBlogs, type Blog } from '../../api/blog'
import { listBlogCategories } from '../../api/blogCategory'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './BlogList.css'

const TAKE = 10

function translationFor(blog: Blog, languageCode: string): string {
  return blog.translations.find((t) => t.languageCode === languageCode)?.title ?? '—'
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('az-AZ')
}

export default function BlogList() {
  const [items, setItems] = useState<Blog[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryNames, setCategoryNames] = useState<Record<number, string>>({})

  useEffect(() => {
    listBlogCategories({ take: 100 }).then((result) => {
      const map: Record<number, string> = {}
      for (const category of result.items) {
        map[category.id] = category.translations[0]?.name ?? `#${category.id}`
      }
      setCategoryNames(map)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    listBlogs({ search, page, take: TAKE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Bloqlar yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page])

  async function handleDelete(id: number) {
    if (!confirm('Bu bloqu silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteBlog(id)
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
    <div className="blog-list">
      <div className="blog-list-header">
        <h1>Bloqlar</h1>
        <Link to="/blogs/new" className="btn btn-primary">
          + Yeni bloq
        </Link>
      </div>

      <form className="blog-search" onSubmit={handleSearchSubmit}>
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

      {error && <div className="blog-error">{error}</div>}

      <div className="blog-table-wrap">
        <table className="blog-table">
          <thead>
            <tr>
              <th>Şəkil</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Başlıq ({lang.label})</th>
              ))}
              <th>Slug</th>
              <th>Kateqoriya</th>
              <th>Nəşr tarixi</th>
              <th>Status</th>
              <th aria-label="Əməliyyatlar" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 6}>Yüklənir…</td>
              </tr>
            )}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={SUPPORTED_LANGUAGES.length + 6}>Nəticə tapılmadı</td>
              </tr>
            )}

            {!isLoading &&
              items.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    {resolveImageUrl(blog.imageUrl) ? (
                      <img
                        className="blog-thumb"
                        src={resolveImageUrl(blog.imageUrl) ?? undefined}
                        alt=""
                      />
                    ) : (
                      <div className="blog-thumb blog-thumb-empty" />
                    )}
                  </td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(blog, lang.code)}</td>
                  ))}
                  <td>{blog.slug}</td>
                  <td>{categoryNames[blog.blogCategoryId] ?? '—'}</td>
                  <td>{formatDate(blog.publishedAt)}</td>
                  <td>
                    <span className={`badge ${blog.status ? 'badge-active' : 'badge-inactive'}`}>
                      {blog.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="blog-actions">
                    <Link to={`/blogs/${blog.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(blog.id)}
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
        <div className="blog-pagination">
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
