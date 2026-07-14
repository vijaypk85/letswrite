import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadStories()
  }, [user])

  async function loadStories() {
    setLoading(true)
    const q = query(
      collection(db, 'stories'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    setStories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
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

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">everything you've published</p>
        <h1 className="page-title">My stories</h1>

        {loading && <p className="loading-note">Loading…</p>}

        {!loading && stories.length === 0 && (
          <div className="empty-state">You haven't published a story yet.</div>
        )}

        {stories.map((story) => (
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
