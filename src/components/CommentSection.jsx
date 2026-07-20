import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function CommentSection({ storyId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'stories', storyId, 'comments'),
      orderBy('createdAt', 'asc')
    )
    // live-updating: new (and deleted) comments appear without a page refresh
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [storyId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!text.trim()) return

    setPosting(true)
    try {
      await addDoc(collection(db, 'stories', storyId, 'comments'), {
        text: text.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      })
      setText('')
    } catch (err) {
      console.error(err)
      setError('Could not post your comment. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(commentId) {
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) return

    setDeletingId(commentId)
    try {
      await deleteDoc(doc(db, 'stories', storyId, 'comments', commentId))
    } catch (err) {
      console.error(err)
      window.alert('Could not delete your comment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="comments-section">
      <h2 className="comments-heading">
        {comments.length === 0 ? 'Comments' : `Comments (${comments.length})`}
      </h2>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            className="comment-input"
            placeholder="Share your thoughts on this story…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button className="btn btn-small" type="submit" disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Post comment'}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      ) : (
        <p className="comment-signin-note">Sign in to leave a comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="empty-state">No comments yet. Be the first to say something.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-author">{c.authorName}</span>
                {user && user.uid === c.authorId && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                  >
                    {deletingId === c.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
