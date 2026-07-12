import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          Story<span className="brand-mark">Loom</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Read</Link>
          {user && <Link to="/my-stories">My stories</Link>}
          {user ? (
            <>
              <Link to="/write" className="btn">
                Write
              </Link>
              <button onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="btn">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
