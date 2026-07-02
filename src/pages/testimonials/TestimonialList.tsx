import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteTestimonial,
  listTestimonials,
  type Testimonial,
} from '../../api/testimonial'
import { ApiError } from '../../api/client'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './TestimonialList.css'

const TAKE = 10

function quoteFor(testimonial: Testimonial, languageCode: string): string {
  return testimonial.translations.find((t) => t.languageCode === languageCode)?.quote ?? '—'
}

export default function TestimonialList() {
  const [items, setItems] = useState<Testimonial[]>([])
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

    listTestimonials({ search, page, take: TAKE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Rəylər yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page])

  async function handleDelete(id: number) {
    if (!confirm('Bu rəyi silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteTestimonial(id)
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
    <div className="testimonial-list">
      <div className="testimonial-list-header">
        <h1>Rəylər</h1>
        <Link to="/testimonials/new" className="btn btn-primary">
          + Yeni rəy
        </Link>
      </div>

      <form className="testimonial-search" onSubmit={handleSearchSubmit}>
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

      {error && <div className="testimonial-error">{error}</div>}

      <div className="testimonial-table-wrap">
        <table className="testimonial-table">
          <thead>
            <tr>
              <th>Müştəri</th>
              <th>Reytinq</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Rəy ({lang.label})</th>
              ))}
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
              items.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td>{testimonial.customerName}</td>
                  <td>{'★'.repeat(testimonial.rating)}</td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code} className="testimonial-quote-cell">
                      {quoteFor(testimonial, lang.code)}
                    </td>
                  ))}
                  <td>
                    <span
                      className={`badge ${testimonial.status ? 'badge-active' : 'badge-inactive'}`}
                    >
                      {testimonial.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="testimonial-actions">
                    <Link to={`/testimonials/${testimonial.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(testimonial.id)}
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
        <div className="testimonial-pagination">
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
