import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

const WORD_LIMIT = 2000

function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export default function Write() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)

  const wordCount = useMemo(() => countWords(content), [content])
  const overLimit = wordCount > WORD_LIMIT
  const pct = Math.min(100, (wordCount / WORD_LIMIT) * 100)

  let meterClass = 'ink-meter-fill'
  if (overLimit) meterClass += ' over'
  else if (wordCount > WORD_LIMIT * 0.9) meterClass += ' warn'

  async function handlePublish() {
    setError(null)
    if (!title.trim()) {
      setError('Give your story a title before publishing.')
      return
    }
    if (wordCount === 0) {
      setError('Write something before publishing.')
      return
    }
    if (overLimit) {
      setError(`Your story is ${wordCount - WORD_LIMIT} words over the ${WORD_LIMIT}-word limit.`)
      return
    }

    setPublishing(true)
    try {
      const docRef = await addDoc(collection(db, 'stories'), {
        title: title.trim(),
        content: content.trim(),
        wordCount,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      })
      navigate(`/story/${docRef.id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while publishing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">write a story, up to {WORD_LIMIT} words</p>
        <h1 className="page-title">New story</h1>

        <div className="write-shell">
          <input
            className="title-input"
            placeholder="Story title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <textarea
            className="body-textarea"
            placeholder="Once upon a time…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="write-footer">
            <div className="ink-meter">
              <div className="ink-meter-track">
                <div className={meterClass} style={{ width: `${pct}%` }} />
              </div>
              <div className="ink-meter-label">
                {wordCount} / {WORD_LIMIT} words
              </div>
            </div>
            <button className="btn" onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
