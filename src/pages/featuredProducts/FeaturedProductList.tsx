import { useEffect, useState, type FormEvent } from 'react'
import {
  createFeaturedProduct,
  deleteFeaturedProduct,
  listFeaturedProducts,
} from '../../api/featuredProduct'
import { getProduct, listProducts, type Product } from '../../api/product'
import { ApiError } from '../../api/client'
import { resolveImageUrl } from '../../api/media'
import { SUPPORTED_LANGUAGES } from '../../config/languages'
import './FeaturedProductList.css'

interface FeaturedRow {
  featuredId: number
  product: Product | null
}

function nameFor(product: Product): string {
  return (
    product.translations.find((t) => t.languageCode === SUPPORTED_LANGUAGES[0]?.code)?.name ??
    product.translations[0]?.name ??
    product.slug
  )
}

export default function FeaturedProductList() {
  const [featured, setFeatured] = useState<FeaturedRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  function loadFeatured() {
    setIsLoading(true)
    setError(null)

    listFeaturedProducts({ take: 100 })
      .then(async (result) => {
        const rows = await Promise.all(
          result.items.map(async (item) => {
            try {
              const product = await getProduct(item.productId)
              return { featuredId: item.id, product }
            } catch {
              return { featuredId: item.id, product: null }
            }
          }),
        )
        setFeatured(rows)
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Seçilmiş məhsullar yüklənmədi')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadFeatured()
  }, [])

  async function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    if (!searchInput.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const result = await listProducts({ search: searchInput.trim(), take: 20 })
      setSearchResults(result.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Axtarış zamanı xəta baş verdi')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleAdd(productId: number) {
    setAddingId(productId)
    setError(null)
    try {
      await createFeaturedProduct(productId)
      loadFeatured()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Əlavə edilmədi')
    } finally {
      setAddingId(null)
    }
  }

  async function handleRemove(featuredId: number) {
    if (!confirm('Bu məhsulu seçilmişlərdən çıxarmaq istədiyinizə əminsiniz?')) return

    try {
      await deleteFeaturedProduct(featuredId)
      setFeatured((prev) => prev.filter((row) => row.featuredId !== featuredId))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Silinmə zamanı xəta baş verdi')
    }
  }

  const featuredProductIds = new Set(featured.map((row) => row.product?.id).filter(Boolean))

  return (
    <div className="featured-product-page">
      <h1>Seçilmiş Məhsullar</h1>

      {error && <div className="featured-product-error">{error}</div>}

      <section className="featured-product-search-section">
        <h2>Məhsul axtar</h2>
        <form className="featured-product-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="Məhsul adı ilə axtar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isSearching}>
            {isSearching ? 'Axtarılır…' : 'Axtar'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="featured-product-results">
            {searchResults.map((product) => {
              const isFeatured = featuredProductIds.has(product.id)
              return (
                <li key={product.id} className="featured-product-result">
                  {resolveImageUrl(product.imageUrl) ? (
                    <img
                      className="featured-product-thumb"
                      src={resolveImageUrl(product.imageUrl) ?? undefined}
                      alt=""
                    />
                  ) : (
                    <div className="featured-product-thumb featured-product-thumb-empty" />
                  )}
                  <span className="featured-product-name">{nameFor(product)}</span>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    disabled={isFeatured || addingId === product.id}
                    onClick={() => handleAdd(product.id)}
                  >
                    {isFeatured
                      ? 'Artıq seçilib'
                      : addingId === product.id
                        ? 'Əlavə edilir…'
                        : 'Əlavə et'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="featured-product-list-section">
        <h2>Hazırkı seçilmiş məhsullar</h2>

        {isLoading && <p>Yüklənir…</p>}

        {!isLoading && featured.length === 0 && <p>Hələ seçilmiş məhsul yoxdur</p>}

        {!isLoading && featured.length > 0 && (
          <ul className="featured-product-results">
            {featured.map((row) => (
              <li key={row.featuredId} className="featured-product-result">
                {row.product && resolveImageUrl(row.product.imageUrl) ? (
                  <img
                    className="featured-product-thumb"
                    src={resolveImageUrl(row.product.imageUrl) ?? undefined}
                    alt=""
                  />
                ) : (
                  <div className="featured-product-thumb featured-product-thumb-empty" />
                )}
                <span className="featured-product-name">
                  {row.product ? nameFor(row.product) : `#${row.featuredId}`}
                </span>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => handleRemove(row.featuredId)}
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
