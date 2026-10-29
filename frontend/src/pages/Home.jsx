
import { Link } from "react-router-dom";
import "../App.css";

const features = [
  {
    number: "01",
    icon: "◈",
    title: "Identity Wallet",
    description:
      "Keep your digital credentials organized in one place and explore your identity at a glance.",
    tag: "YOUR CREDENTIALS",
  },
  {
    number: "02",
    icon: "⌘",
    title: "Permission Control",
    description:
      "Choose how access to your information is managed, with privacy and consent at the center.",
    tag: "YOUR PERMISSIONS",
  },
  {
    number: "03",
    icon: "↗",
    title: "Activity History",
    description:
      "Review illustrative activity records and understand how identity-related actions can be tracked.",
    tag: "YOUR ACTIVITY",
  },
];

function Home() {
  return (
    <div className="home-page">
      <nav className="navbar">
        <Link className="logo" to="/">
          <span className="brand-icon">P</span>
          <span>PrivyChain<span className="logo-dot">.</span></span>
        </Link>

        <div className="nav-center">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>

        <Link className="nav-button" to="/dashboard">
          Open Dashboard <span>↗</span>
        </Link>
      </nav>

      <main>
        <section className="hero" id="about">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              A NEW APPROACH TO DIGITAL IDENTITY
            </div>

            <h1>
              Your Identity.
              <br />
              <span>Your Data.</span>
              <br />
              <span className="gradient-text">Your Rules.</span>
            </h1>

            <p className="hero-description">
              Your personal information deserves more control.
              PrivyChain explores a privacy-focused way to manage
              digital credentials and permissions with blockchain technology.
            </p>

            <div className="hero-actions">
              <Link className="primary-cta" to="/dashboard">
                Explore PrivyChain <span>→</span>
              </Link>
              <a className="text-cta" href="#features">
                Discover features <span>↓</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="note-icon">✳</span>
              <span>Built around privacy, consent and transparency</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />

            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />

            <div className="identity-card">
              <div className="identity-card-top">
                <div className="mini-brand">
                  <span className="brand-icon small">P</span>
                  <span>PRIVYCHAIN</span>
                </div>
                <span className="card-menu">•••</span>
              </div>

              <div className="identity-symbol">
                <div className="symbol-ring">
                  <span>◈</span>
                </div>
              </div>

              <p className="card-overline">DIGITAL IDENTITY</p>
              <h3>Your identity, your control.</h3>
              <p className="card-subtitle">
                A workspace for your digital credentials.
              </p>

              <div className="card-divider" />

              <div className="credential-row">
                <div className="credential-icon">▤</div>
                <div className="credential-info">
                  <strong>Student Credential</strong>
                  <span>Example credential</span>
                </div>
                <span className="credential-arrow">↗</span>
              </div>

              <div className="credential-row">
                <div className="credential-icon purple">◇</div>
                <div className="credential-info">
                  <strong>Access Permissions</strong>
                  <span>Review your access settings</span>
                </div>
                <span className="credential-arrow">↗</span>
              </div>

              <div className="card-footer">
                <span className="footer-shield">◇</span>
                <span>PRIVACY BY DESIGN</span>
                <span className="footer-line" />
              </div>
            </div>

            <div className="floating-chip chip-top">
              <span className="chip-icon">◈</span>
              <span>
                <strong>Identity</strong>
                <small>In your control</small>
              </span>
            </div>

            <div className="floating-chip chip-bottom">
              <span className="chip-check">✓</span>
              <span>
                <strong>Consent matters</strong>
                <small>You choose what to share</small>
              </span>
            </div>

            <span className="visual-star star-one">✳</span>
            <span className="visual-star star-two">✦</span>
          </div>
        </section>

        <section className="principles">
          <div>
            <span className="principle-icon">◈</span>
            <span>Identity ownership</span>
          </div>
          <span className="principle-divider" />
          <div>
            <span className="principle-icon">⌘</span>
            <span>Consent-driven access</span>
          </div>
          <span className="principle-divider" />
          <div>
            <span className="principle-icon">↗</span>
            <span>Transparent activity</span>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">THE PRIVYCHAIN EXPERIENCE</p>
              <h2>
                Your identity.
                <br />
                <span>One connected workspace.</span>
              </h2>
            </div>
            <p className="section-description">
              Explore the tools designed to bring digital identity,
              access permissions and activity into one clear experience.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <div className="feature-top">
                  <span className="feature-icon">{feature.icon}</span>
                  <span className="feature-number">{feature.number}</span>
                </div>

                <p className="feature-tag">{feature.tag}</p>
                <h3>{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>

                <Link
                  className="feature-link"
                  to={
                    feature.number === "01"
                      ? "/identity"
                      : feature.number === "02"
                        ? "/permissions"
                        : "/activity"
                  }
                >
                  Explore feature <span>↗</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-cta">
          <div>
            <p className="section-eyebrow">TAKE THE FIRST STEP</p>
            <h2>Your data. Your decisions.</h2>
            <p>
              Explore the PrivyChain prototype and discover a more
              user-centered approach to digital identity.
            </p>
          </div>

          <Link className="primary-cta" to="/dashboard">
            Enter Workspace <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <Link className="logo footer-logo" to="/">
          <span className="brand-icon">P</span>
          <span>PrivyChain<span className="logo-dot">.</span></span>
        </Link>

        <p>Your Identity. Your Data. Your Rules.</p>
        <span>© 2026 PrivyChain · Prototype</span>
      </footer>
    </div>
  );
}

export default Home;
