import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import CommentSection from '../components/CommentSection.jsx'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export default function StoryDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    const snap = await getDoc(doc(db, 'stories', id))
    if (snap.exists()) {
      setStory({ id: snap.id, ...snap.data() })
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  async function toggleLike() {
    if (!user || liking) return
    const hasLiked = (story.likedBy || []).includes(user.uid)
    setLiking(true)

    // optimistic update so the click feels instant
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
      // revert on failure
      load()
    } finally {
      setLiking(false)
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
          <p className="detail-body">{story.content}</p>

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
        </div>

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
