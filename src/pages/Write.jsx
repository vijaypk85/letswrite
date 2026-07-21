import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { renderFormattedText } from '../utils/formatStory.jsx'

const WORD_LIMIT = 2000
const DRAFT_KEY = 'storyloom-write-draft'

function countWords(text) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export default function Write() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const textareaRef = useRef(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // Load any draft saved earlier in this browser tab, so a refresh doesn't
  // lose what you were writing. Session-only — it's cleared on publish and
  // doesn't persist once the tab is closed.
  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.title || parsed.content) {
        setTitle(parsed.title || '')
        setContent(parsed.content || '')
        setDraftRestored(true)
      }
    } catch (err) {
      console.error('Could not read saved draft', err)
    }
  }, [])

  // Save on every change.
  useEffect(() => {
    if (!title && !content) return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }))
  }, [title, content])

  // Warn before closing/refreshing the tab with unsaved text. Note: this
  // only covers leaving the site (tab close, refresh, typed URL) — it does
  // not intercept clicking another link inside the app, since that would
  // need a "data router" (createBrowserRouter) instead of the plain
  // BrowserRouter this project uses.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (title.trim() || content.trim()) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [title, content])

  const wordCount = useMemo(() => countWords(content), [content])
  const overLimit = wordCount > WORD_LIMIT
  const pct = Math.min(100, (wordCount / WORD_LIMIT) * 100)

  let meterClass = 'ink-meter-fill'
  if (overLimit) meterClass += ' over'
  else if (wordCount > WORD_LIMIT * 0.9) meterClass += ' warn'

  function applyFormat(marker) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.slice(0, start)
    const selected = content.slice(start, end) || 'text'
    const after = content.slice(end)

    setContent(`${before}${marker}${selected}${marker}${after}`)

    requestAnimationFrame(() => {
      textarea.focus()
      const newStart = start + marker.length
      textarea.setSelectionRange(newStart, newStart + selected.length)
    })
  }

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
        likedBy: [],
        createdAt: serverTimestamp(),
      })
      sessionStorage.removeItem(DRAFT_KEY)
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

        {draftRestored && (
          <p className="draft-note">Restored your unsaved draft from this browser tab.</p>
        )}

        <div className="write-shell">
          <div className="write-toolbar">
            <div className="format-buttons">
              <button
                type="button"
                className="format-btn"
                onClick={() => applyFormat('**')}
                disabled={previewMode}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className="format-btn"
                onClick={() => applyFormat('*')}
                disabled={previewMode}
                title="Italic"
              >
                <em>I</em>
              </button>
            </div>
            <button
              type="button"
              className="btn-ghost btn-small"
              onClick={() => setPreviewMode((p) => !p)}
            >
              {previewMode ? 'Back to editing' : 'Preview'}
            </button>
          </div>

          {previewMode ? (
            <div className="write-preview">
              <h2 className="detail-title">{title.trim() || 'Untitled story'}</h2>
              <p className="detail-body">
                {content.trim() ? renderFormattedText(content) : 'Nothing written yet.'}
              </p>
            </div>
          ) : (
            <>
              <input
                className="title-input"
                placeholder="Story title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              <textarea
                ref={textareaRef}
                className="body-textarea"
                placeholder="Once upon a time… select text and use Bold/Italic above, or wrap it yourself in **bold** / *italic*."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </>
          )}

          <div className="write-footer">
            <div className="ink-meter">
              <div className="ink-meter-track">
                <div className={meterClass} style={{ width: `${pct}%` }} />
              </div>
              <div className="ink-meter-label">
                {wordCount} / {WORD_LIMIT} words · {content.length} characters
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
