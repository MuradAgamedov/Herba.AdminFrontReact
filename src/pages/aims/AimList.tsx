import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteAim, listAims, type Aim } from '../../api/aim'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './AimList.css'

const TAKE = 10

function translationFor(aim: Aim, languageCode: string): string {
  return aim.translations.find((t) => t.languageCode === languageCode)?.title ?? '—'
}

export default function AimList() {
  const [items, setItems] = useState<Aim[]>([])
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

    listAims({ search, page, take: TAKE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Məqsədlər yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page])

  async function handleDelete(id: number) {
    if (!confirm('Bu məqsədi silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteAim(id)
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
    <div className="aim-list">
      <div className="aim-list-header">
        <h1>Məqsədlər</h1>
        <Link to="/aims/new" className="btn btn-primary">
          + Yeni məqsəd
        </Link>
      </div>

      <form className="aim-search" onSubmit={handleSearchSubmit}>
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

      {error && <div className="aim-error">{error}</div>}

      <div className="aim-table-wrap">
        <table className="aim-table">
          <thead>
            <tr>
              <th>İkon</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Başlıq ({lang.label})</th>
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
              items.map((aim) => (
                <tr key={aim.id}>
                  <td>
                    {resolveImageUrl(aim.iconUrl) ? (
                      <img
                        className="aim-thumb"
                        src={resolveImageUrl(aim.iconUrl) ?? undefined}
                        alt=""
                      />
                    ) : (
                      <div className="aim-thumb aim-thumb-empty" />
                    )}
                  </td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(aim, lang.code)}</td>
                  ))}
                  <td>
                    <span className={`badge ${aim.status ? 'badge-active' : 'badge-inactive'}`}>
                      {aim.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="aim-actions">
                    <Link to={`/aims/${aim.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(aim.id)}
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
        <div className="aim-pagination">
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
