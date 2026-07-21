import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

export default function Terms() {
  usePageTitle('Terms & Conditions')
  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">the rules, in plain language</p>
        <h1 className="page-title">Terms &amp; Conditions</h1>

        <div className="info-block">
          <p>Last updated: July 19, 2026</p>
          <p>
            StoryLoom is a free platform for reading and writing short stories. By using it, you're
            agreeing to the following — we've kept it short on purpose.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">1. Your account</h2>
          <p>
            You sign in with your Google account. You're responsible for whatever gets published
            under your account, so keep it secure.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">2. Your stories</h2>
          <p>
            Whatever you write is yours. By publishing on StoryLoom, you're giving us permission to
            display it on the site so other people can read it — that's it. We don't sell it, and we
            don't claim ownership of it.
          </p>
          <p>Stories are limited to 2,000 words. You can edit or delete your own stories at any time.</p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">3. What you can't post</h2>
          <p>
            No hate speech, harassment, illegal content, spam, or anything that infringes someone
            else's copyright. We may remove content that breaks these rules, and repeated violations
            may lead to your account being restricted.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">4. No guarantees</h2>
          <p>
            StoryLoom is provided free, as-is, with no warranty. We do our best to keep it running
            and your stories safe, but we can't promise the service will always be available or
            error-free.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">5. Changes</h2>
          <p>
            We may update these terms as the site grows. If we make significant changes, we'll post
            an update here.
          </p>
        </div>

        <div className="info-block">
          <h2 className="section-heading">6. Questions</h2>
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
