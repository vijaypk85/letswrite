import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'

const DAYS_SHOWN = 7

function lastNDays(n) {
  const days = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export default function StoryViewsPanel({ storyId, totalViews }) {
  const [loading, setLoading] = useState(true)
  const [dailyCounts, setDailyCounts] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const snap = await getDocs(collection(db, 'stories', storyId, 'dailyViews'))
        const counts = {}
        snap.docs.forEach((d) => {
          counts[d.id] = d.data().count || 0
        })
        setDailyCounts(counts)
      } catch (err) {
        console.error('Could not load view analytics', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [storyId])

  const days = lastNDays(DAYS_SHOWN)
  const maxCount = Math.max(1, ...days.map((d) => dailyCounts[d] || 0))

  return (
    <div className="views-panel">
      <div className="views-panel-header">
        <span className="stat-number views-panel-total">{totalViews || 0}</span>
        <span className="stat-label">total views</span>
      </div>

      {loading ? (
        <p className="loading-note views-panel-loading">Loading view history…</p>
      ) : (
        <div className="sparkline">
          {days.map((day) => {
            const count = dailyCounts[day] || 0
            const heightPct = Math.max(4, (count / maxCount) * 100)
            const label = day.slice(5) // MM-DD
            return (
              <div className="sparkline-bar-wrap" key={day} title={`${label}: ${count} views`}>
                <div className="sparkline-bar" style={{ height: `${heightPct}%` }} />
                <span className="sparkline-label">{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
