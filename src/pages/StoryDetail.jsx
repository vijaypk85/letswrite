import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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
import CommentSection from '../components/CommentSection.jsx'
import { renderFormattedText } from '../utils/formatStory.jsx'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export default function StoryDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liking, setLiking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [moreFromAuthor, setMoreFromAuthor] = useState([])
  const [prevStory, setPrevStory] = useState(null)
  const [nextStory, setNextStory] = useState(null)

  usePageTitle(story?.title)

  useEffect(() => {
    load()
    // reset per-story UI state when navigating between stories via prev/next
    setCopied(false)
    setReported(false)
  }, [id])

  async function load() {
    setLoading(true)
    setNotFound(false)
    const snap = await getDoc(doc(db, 'stories', id))
    if (!snap.exists()) {
      setNotFound(true)
      setLoading(false)
      return
    }
    const data = { id: snap.id, ...snap.data() }
    setStory(data)
    setLoading(false)
    loadMoreFromAuthor(data)
    loadNeighbors(data)
  }

  async function loadMoreFromAuthor(currentStory) {
    const q = query(
      collection(db, 'stories'),
      where('authorId', '==', currentStory.authorId),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const snapshot = await getDocs(q)
    const others = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.id !== currentStory.id)
      .slice(0, 4)
    setMoreFromAuthor(others)
  }

  async function loadNeighbors(currentStory) {
    // "Previous" = the next-newer story, "Next" = the next-older story —
    // matches the order stories appear in on the home feed (newest first).
    const newerQ = query(
      collection(db, 'stories'),
      where('createdAt', '>', currentStory.createdAt),
      orderBy('createdAt', 'asc'),
      limit(1)
    )
    const olderQ = query(
      collection(db, 'stories'),
      where('createdAt', '<', currentStory.createdAt),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    const [newerSnap, olderSnap] = await Promise.all([getDocs(newerQ), getDocs(olderQ)])
    setPrevStory(newerSnap.empty ? null : { id: newerSnap.docs[0].id, ...newerSnap.docs[0].data() })
    setNextStory(olderSnap.empty ? null : { id: olderSnap.docs[0].id, ...olderSnap.docs[0].data() })
  }

  async function toggleLike() {
    if (!user || liking) return
    const hasLiked = (story.likedBy || []).includes(user.uid)
    setLiking(true)

    setStory((prev) => ({
      ...prev,
      likedBy: hasLiked
        ? prev.likedBy.filter((uid) => uid !== user.uid)
        : [...(prev.likedBy || []), user.uid],
    }))

    try {
      await updateDoc(doc(db, 'stories', id), {
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
    } catch (err) {
      console.error(err)
      load()
    } finally {
      setLiking(false)
    }
  }

  async function handleShare() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
      window.prompt('Copy this link:', url)
    }
  }

  async function handleReport() {
    if (!user || reporting || reported) return
    const confirmed = window.confirm('Report this story to the site owner for review?')
    if (!confirmed) return

    setReporting(true)
    try {
      await addDoc(collection(db, 'reports'), {
        storyId: id,
        storyTitle: story.title,
        reporterId: user.uid,
        createdAt: serverTimestamp(),
      })
      setReported(true)
      showToast('Thanks — we\'ve noted this report.')
    } catch (err) {
      console.error(err)
      window.alert('Could not send the report. Please try again.')
    } finally {
      setReporting(false)
    }
  }

  if (loading) return <p className="loading-note">Loading story…</p>
  if (notFound) return <p className="center-note">This story doesn't exist, or was removed.</p>

  const likedBy = story.likedBy || []
  const hasLiked = user && likedBy.includes(user.uid)

  return (
    <div className="page">
      <div className="container">
        <div className="detail-shell">
          <h1 className="detail-title">{story.title}</h1>
          <div className="story-meta">
            <span>{story.authorName}</span>
            <span>·</span>
            <span>{readingTime(story.wordCount)}</span>
            <span>·</span>
            <span>{story.wordCount} words</span>
          </div>
          <p className="detail-body">{renderFormattedText(story.content)}</p>

          <div className="detail-actions-row">
            <div className="like-row">
              <button
                className={`like-btn ${hasLiked ? 'liked' : ''}`}
                onClick={toggleLike}
                disabled={!user || liking}
                title={user ? undefined : 'Sign in to like this story'}
              >
                <HeartIcon filled={hasLiked} />
                {hasLiked ? 'Liked' : 'Like'}
              </button>
              <span className="like-count">
                {likedBy.length} {likedBy.length === 1 ? 'like' : 'likes'}
              </span>
            </div>

            <div className="secondary-actions">
              <button className="btn-ghost btn-small" onClick={handleShare}>
                {copied ? 'Link copied!' : 'Share'}
              </button>
              <button
                className="btn-ghost btn-small"
                onClick={handleReport}
                disabled={!user || reporting || reported}
                title={user ? undefined : 'Sign in to report this story'}
              >
                {reported ? 'Reported' : 'Report'}
              </button>
            </div>
          </div>
        </div>

        {(prevStory || nextStory) && (
          <div className="story-nav">
            {prevStory ? (
              <button className="story-nav-btn" onClick={() => navigate(`/story/${prevStory.id}`)}>
                <span className="story-nav-label">← Newer</span>
                <span className="story-nav-title">{prevStory.title}</span>
              </button>
            ) : (
              <span />
            )}
            {nextStory ? (
              <button
                className="story-nav-btn story-nav-btn-right"
                onClick={() => navigate(`/story/${nextStory.id}`)}
              >
                <span className="story-nav-label">Older →</span>
                <span className="story-nav-title">{nextStory.title}</span>
              </button>
            ) : (
              <span />
            )}
          </div>
        )}

        {moreFromAuthor.length > 0 && (
          <div className="more-from-author">
            <h2 className="comments-heading">More from {story.authorName}</h2>
            {moreFromAuthor.map((s) => (
              <Link key={s.id} to={`/story/${s.id}`} className="more-from-author-item">
                {s.title}
              </Link>
            ))}
          </div>
        )}

        <CommentSection storyId={id} />
      </div>
    </div>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6c-1.9-1.6-4.7-1.4-6.4.4L12 7.5 9.6 5c-1.7-1.8-4.5-2-6.4-.4-2.1 1.8-2.2 5-.3 6.9l8.4 8.6a.9.9 0 0 0 1.3 0l8.4-8.6c1.9-1.9 1.8-5.1-.3-6.9z" />
    </svg>
  )
}
