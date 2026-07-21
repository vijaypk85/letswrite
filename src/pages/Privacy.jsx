import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Privacy() {
  usePageTitle('Privacy Policy')
  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">what we collect, and why</p>
        <h1 className="page-title">Privacy Policy</h1>

        <div className="info-block">
          <p>Last updated: July 19, 2026</p>
          <p>
            This explains what information StoryLoom collects and how it's used. We keep this to
            the minimum needed to run the site.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">What we collect</h2>
          <p>
            When you sign in with Google, we receive your name, email address, and profile picture
            from your Google account. When you publish a story, we store the title, the text, and
            when you posted it. If you like or comment on a story, we store that too, linked to your
            account.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">What we don't do</h2>
          <p>
            We don't sell your data. We don't share it with advertisers. We don't track you across
            other websites.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">Where it's stored</h2>
          <p>
            Your account and story data are stored using Google Firebase (Authentication and
            Firestore), a cloud service Google provides. Firebase has its own security practices
            that apply to how the data is stored and transmitted.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">What's public</h2>
          <p>
            Any story you publish, along with your name, is visible to anyone who visits the site —
            that's the point of publishing. Comments you post are visible the same way. Your email
            address is never shown publicly.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">Your choices</h2>
          <p>
            You can edit or delete any story or comment you've posted at any time. If you'd like
            your account and all associated data removed entirely, contact us and we'll take care
            of it.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">Changes</h2>
          <p>If this policy changes in a meaningful way, we'll update this page.</p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">Questions</h2>
          <p>
            Reach out any time — details are on the{' '}
            <Link to="/contact" className="inline-link">
              Contact us
            </Link>{' '}
            page.
          </p>
        </div>
      </div>
    </div>
  )
}
