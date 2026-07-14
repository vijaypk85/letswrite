import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadFirstPage()
  }, [])

  async function loadFirstPage() {
    setLoading(true)
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
    const snapshot = await getDocs(q)

    setStories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
    setHasMore(snapshot.docs.length === PAGE_SIZE)
    setLoading(false)
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

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">short stories, two minutes at a time</p>
        <h1 className="page-title">Latest stories</h1>

        {loading && <p className="loading-note">Loading stories…</p>}

        {!loading && stories.length === 0 && (
          <div className="empty-state">No stories yet. Be the first to write one.</div>
        )}

        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}

        {!loading && hasMore && (
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
