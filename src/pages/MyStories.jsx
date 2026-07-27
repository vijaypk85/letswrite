import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import SkeletonCard from '../components/SkeletonCard.jsx'
import StoryViewsPanel from '../components/StoryViewsPanel.jsx'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export default function MyStories() {
  usePageTitle('My stories')
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [duplicatingId, setDuplicatingId] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'liked'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'published' | 'draft'
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [expandedViewsId, setExpandedViewsId] = useState(null)

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
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(storyId)
        return next
      })
      showToast('Story deleted.')
    } catch (err) {
      console.error(err)
      window.alert('Could not delete this story. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    const count = selectedIds.size
    if (count === 0) return
    const confirmed = window.confirm(
      `Delete ${count} selected ${count === 1 ? 'story' : 'stories'}? This can't be undone.`
    )
    if (!confirmed) return

    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => deleteDoc(doc(db, 'stories', id))))
      setStories((prev) => prev.filter((s) => !selectedIds.has(s.id)))
      showToast(`${count} ${count === 1 ? 'story' : 'stories'} deleted.`)
      setSelectedIds(new Set())
    } catch (err) {
      console.error(err)
      window.alert('Could not delete all selected stories. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(story) {
    const newStatus = story.status === 'draft' ? 'published' : 'draft'
    try {
      await updateDoc(doc(db, 'stories', story.id), { status: newStatus })
      setStories((prev) => prev.map((s) => (s.id === story.id ? { ...s, status: newStatus } : s)))
      showToast(newStatus === 'published' ? 'Story published.' : 'Moved back to drafts.')
    } catch (err) {
      console.error(err)
      window.alert('Could not update this story. Please try again.')
    }
  }

  async function handleDuplicate(story) {
    setDuplicatingId(story.id)
    try {
      const docRef = await addDoc(collection(db, 'stories'), {
        title: `Copy of ${story.title}`,
        content: story.content,
        wordCount: story.wordCount,
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Anonymous',
        likedBy: [],
        views: 0,
        status: 'draft',
        createdAt: serverTimestamp(),
      })
      showToast('Story duplicated — opening the copy in Edit.')
      navigate(`/edit/${docRef.id}`)
    } catch (err) {
      console.error(err)
      window.alert('Could not duplicate this story. Please try again.')
    } finally {
      setDuplicatingId(null)
    }
  }

  function toggleSelected(storyId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(storyId)) next.delete(storyId)
      else next.add(storyId)
      return next
    })
  }

  // Total stats always reflect everything you've published, regardless of
  // the current search/sort/status filter — only the list below responds to those.
  const totalLikes = useMemo(
    () => stories.reduce((sum, s) => sum + (s.likedBy?.length || 0), 0),
    [stories]
  )
  const draftCount = useMemo(() => stories.filter((s) => s.status === 'draft').length, [stories])

  const visibleStories = useMemo(() => {
    let list = stories

    if (statusFilter === 'draft') {
      list = list.filter((s) => s.status === 'draft')
    } else if (statusFilter === 'published') {
      list = list.filter((s) => s.status !== 'draft')
    }

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
  }, [stories, search, sortBy, statusFilter])

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">everything you've published</p>
        <h1 className="page-title">My stories</h1>

        {!loading && !error && stories.length > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{stories.length}</span>
              <span className="stat-label">{stories.length === 1 ? 'story' : 'stories'} total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{draftCount}</span>
              <span className="stat-label">{draftCount === 1 ? 'draft' : 'drafts'}</span>
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

        {!loading && !error && stories.length > 0 && (
          <div className="sort-toggle status-filter">
            <button
              className={statusFilter === 'all' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={statusFilter === 'published' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setStatusFilter('published')}
            >
              Published
            </button>
            <button
              className={statusFilter === 'draft' ? 'sort-btn active' : 'sort-btn'}
              onClick={() => setStatusFilter('draft')}
            >
              Drafts
            </button>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="bulk-action-bar">
            <span>{selectedIds.size} selected</span>
            <div className="bulk-action-buttons">
              <button className="btn-ghost btn-small" onClick={() => setSelectedIds(new Set())}>
                Cancel
              </button>
              <button
                className="btn btn-danger-solid btn-small"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? 'Deleting…' : 'Delete selected'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

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
          <div className="empty-state">No stories match your current filters.</div>
        )}

        {visibleStories.map((story) => {
          const isDraft = story.status === 'draft'
          return (
            <article key={story.id} className="story-card my-story-card">
              <div className="my-story-top">
                <input
                  type="checkbox"
                  className="story-checkbox"
                  checked={selectedIds.has(story.id)}
                  onChange={() => toggleSelected(story.id)}
                  aria-label={`Select ${story.title}`}
                />
                <Link to={`/story/${story.id}`} className="my-story-link">
                  <h3 className="story-title">{story.title}</h3>
                  <div className="story-meta">
                    <span className={isDraft ? 'status-badge draft' : 'status-badge published'}>
                      {isDraft ? 'Draft' : 'Published'}
                    </span>
                    <span>{readingTime(story.wordCount)}</span>
                    <span>·</span>
                    <span>{(story.likedBy || []).length} likes</span>
                    <span>·</span>
                    <span>{story.views || 0} views</span>
                  </div>
                </Link>
              </div>

              <div className="story-actions">
                <Link to={`/edit/${story.id}`} className="btn btn-ghost btn-small">
                  Edit
                </Link>
                <button className="btn btn-ghost btn-small" onClick={() => handleToggleStatus(story)}>
                  {isDraft ? 'Publish' : 'Unpublish'}
                </button>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => handleDuplicate(story)}
                  disabled={duplicatingId === story.id}
                >
                  {duplicatingId === story.id ? 'Duplicating…' : 'Duplicate'}
                </button>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => setExpandedViewsId(expandedViewsId === story.id ? null : story.id)}
                >
                  {expandedViewsId === story.id ? 'Hide views' : 'Views'}
                </button>
                <button
                  className="btn btn-ghost btn-small btn-danger"
                  onClick={() => handleDelete(story.id)}
                  disabled={deletingId === story.id}
                >
                  {deletingId === story.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>

              {expandedViewsId === story.id && (
                <StoryViewsPanel storyId={story.id} totalViews={story.views} />
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
