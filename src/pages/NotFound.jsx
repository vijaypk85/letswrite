import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function NotFound() {
  usePageTitle('Page not found')

  return (
    <div className="page">
      <div className="container">
        <div className="not-found">
          <p className="hero-line">404</p>
          <h1 className="page-title">Page not found</h1>
          <p className="not-found-text">
            The page you're looking for doesn't exist, or may have moved.
          </p>
          <Link to="/" className="btn">
            Back to stories
          </Link>
        </div>
      </div>
    </div>
  )
}
