import { Link } from 'react-router-dom'

function readingTime(wordCount) {
  const minutes = Math.max(1, Math.round(wordCount / 200))
  return `${minutes} min read`
}

function excerptOf(content, maxChars = 180) {
  if (content.length <= maxChars) return content
  return content.slice(0, maxChars).trim() + '…'
}

export default function StoryCard({ story }) {
  return (
    <Link to={`/story/${story.id}`}>
      <article className="story-card">
        <h3 className="story-title">{story.title}</h3>
        <div className="story-meta">
          <span>{story.authorName}</span>
          <span>·</span>
          <span>{readingTime(story.wordCount)}</span>
        </div>
        <p className="story-excerpt">{excerptOf(story.content)}</p>
      </article>
    </Link>
  )
}
