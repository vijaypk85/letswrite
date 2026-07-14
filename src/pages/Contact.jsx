export default function Contact() {
  return (
    <div className="page">
      <div className="container">
        <p className="hero-line">get in touch</p>
        <h1 className="page-title">Contact us</h1>

        <div className="info-block">
          <p>
            Questions, feedback, or something not working right? Reach out through any of the
            details below and we'll get back to you.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <h3>Email</h3>
            <p>
              <a href="mailto:hello@storyloom.example">hello@storyloom.example</a>
            </p>
          </div>

          <div className="contact-card">
            <h3>Phone</h3>
            <p>+91 98765 43210</p>
          </div>

          <div className="contact-card">
            <h3>Address</h3>
            <p>
              StoryLoom
              <br />
              12 Example Street, Heritage Town
              <br />
              Chennai, 605001
              <br />
              India
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
