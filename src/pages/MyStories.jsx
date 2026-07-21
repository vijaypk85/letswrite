import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export default function MyStories() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'liked'

  useEffect(() => {
    loadStories()
  }, [user])

  async function loadStories() {
    setLoading(true)
    setError(null)
    try {
      const q = query(
        collection(db, 'stories'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      setStories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error(err)
      setError(
        'Could not load your stories. If this is the first time you\'re seeing this, Firestore ' +
          'likely needs an index for this query — check the browser console for a link to create it, ' +
          'or see firestore.indexes.json in the project.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(storyId) {
    const confirmed = window.confirm('Delete this story? This can\'t be undone.')
    if (!confirmed) return

    setDeletingId(storyId)
    try {
      await deleteDoc(doc(db, 'stories', storyId))
      setStories((prev) => prev.filter((s) => s.id !== storyId))
    } catch (err) {
      console.error(err)
      window.alert('Could not delete this story. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // Total stats always reflect everything you've published, regardless of
  // the current search/sort — only the list below responds to those.
  const totalLikes = useMemo(
    () => stories.reduce((sum, s) => sum + (s.likedBy?.length || 0), 0),
    [stories]
  )

  const visibleStories = useMemo(() => {
    let list = stories

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((s) => s.title.toLowerCase().includes(q))
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'liked') {
        return (b.likedBy?.length || 0) - (a.likedBy?.length || 0)
      }
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
      return sortBy === 'oldest' ? aTime - bTime : bTime - aTime
    })

    return list
  }, [stories, search, sortBy])

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">everything you've published</p>
        <h1 className="page-title">My stories</h1>

        {!loading && !error && stories.length > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{stories.length}</span>
              <span className="stat-label">{stories.length === 1 ? 'story' : 'stories'} published</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{totalLikes}</span>
              <span className="stat-label">total {totalLikes === 1 ? 'like' : 'likes'}</span>
            </div>
          </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="feed-controls">
            <input
              className="search-input"
              type="text"
              placeholder="Search your stories by title…"
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
                className={sortBy === 'oldest' ? 'sort-btn active' : 'sort-btn'}
                onClick={() => setSortBy('oldest')}
              >
                Oldest
              </button>
              <button
                className={sortBy === 'liked' ? 'sort-btn active' : 'sort-btn'}
                onClick={() => setSortBy('liked')}
              >
                Most liked
              </button>
            </div>
          </div>
        )}

        {loading && <p className="loading-note">Loading…</p>}

        {error && <p className="error-text">{error}</p>}

        {!loading && !error && stories.length === 0 && (
          <div className="empty-state">
            <p>You haven't published a story yet.</p>
            <Link to="/write" className="btn">
              Write your first story
            </Link>
          </div>
        )}

        {!loading && !error && stories.length > 0 && visibleStories.length === 0 && (
          <div className="empty-state">No stories match "{search}".</div>
        )}

        {visibleStories.map((story) => (
          <article key={story.id} className="story-card">
            <Link to={`/story/${story.id}`}>
              <h3 className="story-title">{story.title}</h3>
              <div className="story-meta">
                <span>{readingTime(story.wordCount)}</span>
                <span>·</span>
                <span>{(story.likedBy || []).length} likes</span>
              </div>
            </Link>
            <div className="story-actions">
              <Link to={`/edit/${story.id}`} className="btn btn-ghost btn-small">
                Edit
              </Link>
              <button
                className="btn btn-ghost btn-small btn-danger"
                onClick={() => handleDelete(story.id)}
                disabled={deletingId === story.id}
              >
                {deletingId === story.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
