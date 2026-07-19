import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">StoryLoom</div>
          <p className="footer-address">
            12 Example Street, Heritage Town
            <br />
            Puducherry, 605001, India
            <br />
            hello@storyloom.example
          </p>
        </div>
        <div className="footer-links">
          <Link to="/">Read</Link>
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact us</Link>
        </div>
        <div className="footer-links">
          <Link to="/terms">Terms &amp; Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} StoryLoom. All rights reserved.</div>
    </footer>
  )
}
