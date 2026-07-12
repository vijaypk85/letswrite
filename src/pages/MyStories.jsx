import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import StoryCard from '../components/StoryCard.jsx'

export default function MyStories() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, 'stories'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      setStories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      setLoading(false)
    }
    load()
  }, [user])

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
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  )
}
