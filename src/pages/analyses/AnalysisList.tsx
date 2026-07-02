import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deleteAnalysis, listAnalyses, type Analysis } from '../../api/analysis'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './AnalysisList.css'

const TAKE = 10

function translationFor(analysis: Analysis, languageCode: string): string {
  return analysis.translations.find((t) => t.languageCode === languageCode)?.title ?? '—'
}

export default function AnalysisList() {
  const [items, setItems] = useState<Analysis[]>([])
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

    listAnalyses({ search, page, take: TAKE })
      .then((result) => {
        if (cancelled) return
        setItems(result.items)
        setTotalPages(result.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Analizlər yüklənmədi')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page])

  async function handleDelete(id: number) {
    if (!confirm('Bu analizi silmək istədiyinizə əminsiniz?')) return

    try {
      await deleteAnalysis(id)
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
    <div className="analysis-list">
      <div className="analysis-list-header">
        <h1>Analizlər</h1>
        <Link to="/analyses/new" className="btn btn-primary">
          + Yeni analiz
        </Link>
      </div>

      <form className="analysis-search" onSubmit={handleSearchSubmit}>
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

      {error && <div className="analysis-error">{error}</div>}

      <div className="analysis-table-wrap">
        <table className="analysis-table">
          <thead>
            <tr>
              <th>İkon</th>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <th key={lang.code}>Başlıq ({lang.label})</th>
              ))}
              <th>Url</th>
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
              items.map((analysis) => (
                <tr key={analysis.id}>
                  <td>
                    {resolveImageUrl(analysis.iconUrl) ? (
                      <img
                        className="analysis-thumb"
                        src={resolveImageUrl(analysis.iconUrl) ?? undefined}
                        alt=""
                      />
                    ) : (
                      <div className="analysis-thumb analysis-thumb-empty" />
                    )}
                  </td>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <td key={lang.code}>{translationFor(analysis, lang.code)}</td>
                  ))}
                  <td>{analysis.url}</td>
                  <td>
                    <span
                      className={`badge ${analysis.status ? 'badge-active' : 'badge-inactive'}`}
                    >
                      {analysis.status ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </td>
                  <td className="analysis-actions">
                    <Link to={`/analyses/${analysis.id}/edit`} className="btn btn-small">
                      Redaktə et
                    </Link>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(analysis.id)}
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
        <div className="analysis-pagination">
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
