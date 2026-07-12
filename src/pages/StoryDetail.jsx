import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

export default function StoryDetail() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'stories', id))
      if (snap.exists()) {
        setStory({ id: snap.id, ...snap.data() })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <p className="loading-note">Loading story…</p>
  if (notFound) return <p className="center-note">This story doesn't exist, or was removed.</p>

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
        </div>
      </div>
    </div>
  )
}
