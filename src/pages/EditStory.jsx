import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

const WORD_LIMIT = 2000

function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export default function EditStory() {
  usePageTitle('Edit story')
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notAllowed, setNotAllowed] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'stories', id))
      if (!snap.exists()) {
        setError('This story no longer exists.')
        setLoading(false)
        return
      }
      const data = snap.data()
      if (data.authorId !== user.uid) {
        setNotAllowed(true)
        setLoading(false)
        return
      }
      setTitle(data.title)
      setContent(data.content)
      setLoading(false)
    }
    load()
  }, [id, user])

  const wordCount = useMemo(() => countWords(content), [content])
  const overLimit = wordCount > WORD_LIMIT
  const pct = Math.min(100, (wordCount / WORD_LIMIT) * 100)

  let meterClass = 'ink-meter-fill'
  if (overLimit) meterClass += ' over'
  else if (wordCount > WORD_LIMIT * 0.9) meterClass += ' warn'

  async function handleSave() {
    setError(null)
    if (!title.trim()) {
      setError('Give your story a title before saving.')
      return
    }
    if (wordCount === 0) {
      setError('A story needs some words in it.')
      return
    }
    if (overLimit) {
      setError(`Your story is ${wordCount - WORD_LIMIT} words over the ${WORD_LIMIT}-word limit.`)
      return
    }

    setSaving(true)
    try {
      await updateDoc(doc(db, 'stories', id), {
        title: title.trim(),
        content: content.trim(),
        wordCount,
      })
      showToast('Story updated.')
      navigate(`/story/${id}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="loading-note">Loading story…</p>
  if (notAllowed) return <p className="center-note">You can only edit your own stories.</p>

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">editing</p>
        <h1 className="page-title">Edit story</h1>

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
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
