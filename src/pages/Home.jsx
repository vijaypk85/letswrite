import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import StoryCard from '../components/StoryCard.jsx'

export default function Home() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      setStories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">short stories, two minutes at a time</p>
        <h1 className="page-title">Latest stories</h1>

        {loading && <p className="loading-note">Loading stories…</p>}

        {!loading && stories.length === 0 && (
          <div className="empty-state">No stories yet. Be the first to write one.</div>
        )}

        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
