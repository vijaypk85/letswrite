import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const THEME_KEY = 'storyloom-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply the theme to the whole document, so every component's CSS
  // variables (already defined in index.css) pick it up automatically.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function navLinkClass({ isActive }) {
    return isActive ? 'active' : undefined
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" end>
          Story<span className="brand-mark">Loom</span>
        </NavLink>

        <div className="navbar-right">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>

          <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}>
            <NavLink to="/" className={navLinkClass} end>
              Read
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
            {user && (
              <NavLink to="/my-stories" className={navLinkClass}>
                My stories
              </NavLink>
            )}
            {user ? (
              <>
                <NavLink to="/write" className="btn">
                  Write
                </NavLink>
                <button onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <NavLink to="/login" className="btn">
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function HamburgerIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
