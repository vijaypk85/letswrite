import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore'
import { db } from '../firebase.js'
import StoryCard from '../components/StoryCard.jsx'

const PAGE_SIZE = 20

export default function Home() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'liked'

  useEffect(() => {
    loadFirstPage()
  }, [])

  async function loadFirstPage() {
    setLoading(true)
    setError(null)
    try {
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      const snapshot = await getDocs(q)

      setStories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (err) {
      console.error(err)
      setError('Could not load stories. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!lastDoc || loadingMore) return
    setLoadingMore(true)

    const q = query(
      collection(db, 'stories'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    )
    const snapshot = await getDocs(q)

    setStories((prev) => [...prev, ...snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))])
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
    setHasMore(snapshot.docs.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  // Search and "Most liked" sort both work only on the stories already loaded
  // on the page (not the full collection) — keeps this simple without needing
  // a separate search index or a stored like-count field for server-side sorting.
  const visibleStories = useMemo(() => {
    let list = stories

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((s) => s.title.toLowerCase().includes(q))
    }

    if (sortBy === 'liked') {
      list = [...list].sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0))
    }

    return list
  }, [stories, search, sortBy])

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">short stories, two minutes at a time</p>
        <h1 className="page-title">Latest stories</h1>

        <div className="feed-controls">
          <input
            className="search-input"
            type="text"
            placeholder="Search stories by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="sort-toggle">
            <button
              className={sortBy === 'newest' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortBy('newest')}
            >
              Newest
            </button>
            <button
              className={sortBy === 'liked' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setSortBy('liked')}
            >
              Most liked
            </button>
          </div>
        </div>

        {loading && <p className="loading-note">Loading stories…</p>}

        {error && <p className="error-text">{error}</p>}

        {!loading && !error && stories.length === 0 && (
          <div className="empty-state">
            <p>No stories yet. Be the first to write one.</p>
            <Link to="/write" className="btn">
              Write the first story
            </Link>
          </div>
        )}

        {!loading && !error && stories.length > 0 && visibleStories.length === 0 && (
          <div className="empty-state">No stories match "{search}".</div>
        )}

        {visibleStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}

        {!loading && !search && hasMore && (
          <div className="load-more-row">
            <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more stories'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
