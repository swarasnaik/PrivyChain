
import { useState } from "react";
import "./IdentityWallet.css";

const initialCredentials = [
  {
    id: 1,
    name: "Student Identity",
    type: "Identity",
    issuer: "University Portal",
    date: "28 Oct 2026",
    status: "Verified",
    icon: "🎓",
  },
  {
    id: 2,
    name: "Academic Certificate",
    type: "Certificate",
    issuer: "Academic Institution",
    date: "15 Sep 2026",
    status: "Verified",
    icon: "📜",
  },
  {
    id: 3,
    name: "Personal Identity",
    type: "Personal",
    issuer: "Identity Provider",
    date: "Pending review",
    status: "Pending",
    icon: "🪪",
  },
];

function IdentityWallet() {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filteredCredentials =
    filter === "All"
      ? credentials
      : credentials.filter((item) => item.status === filter);

  function removeCredential(id) {
    setCredentials((current) =>
      current.filter((item) => item.id !== id)
    );
    setSelected(null);
  }

  return (
    <section className="identity-wallet">
      <div className="iw-heading">
        <div>
          <span className="iw-eyebrow">YOUR DIGITAL IDENTITY</span>
          <h1>Identity Wallet</h1>
          <p>Manage your credentials and stay in control of your data.</p>
        </div>

        <div className="iw-wallet-status">
          <span className="iw-status-dot"></span>
          Demo wallet
        </div>
      </div>

      <div className="iw-summary">
        <div>
          <span>Total credentials</span>
          <strong>{credentials.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>Verified</span>
          <strong>
            {credentials.filter((item) => item.status === "Verified").length
              .toString()
              .padStart(2, "0")}
          </strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>
            {credentials.filter((item) => item.status === "Pending").length
              .toString()
              .padStart(2, "0")}
          </strong>
        </div>
      </div>

      <div className="iw-section-heading">
        <div>
          <h2>My Credentials</h2>
          <p>Your credentials in one place.</p>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter credentials"
        >
          <option value="All">All credentials</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="iw-credential-grid">
        {filteredCredentials.map((credential) => (
          <article className="iw-card" key={credential.id}>
            <div className="iw-card-top">
              <div className="iw-credential-icon">{credential.icon}</div>
              <span
                className={`iw-badge ${
                  credential.status === "Verified"
                    ? "iw-verified"
                    : "iw-pending"
                }`}
              >
                {credential.status}
              </span>
            </div>

            <span className="iw-type">{credential.type}</span>
            <h3>{credential.name}</h3>
            <p className="iw-issuer">Issued by {credential.issuer}</p>

            <div className="iw-card-footer">
              <span>{credential.date}</span>
              <button onClick={() => setSelected(credential)}>
                View details →
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredCredentials.length === 0 && (
        <div className="iw-empty">
          No credentials match this filter.
        </div>
      )}

      <div className="iw-privacy-note">
        <span>🔒</span>
        <div>
          <strong>Your identity, your rules.</strong>
          <p>
            This prototype uses sample credentials. No real identity documents
            are stored or verified, and no blockchain connection is active.
          </p>
        </div>
      </div>

      {selected && (
        <div
          className="iw-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="iw-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="iw-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="iw-close"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <div className="iw-credential-icon">{selected.icon}</div>
            <span className="iw-eyebrow">CREDENTIAL DETAILS</span>
            <h2 id="iw-modal-title">{selected.name}</h2>

            <div className="iw-detail-row">
              <span>Credential type</span>
              <strong>{selected.type}</strong>
            </div>
            <div className="iw-detail-row">
              <span>Issuer</span>
              <strong>{selected.issuer}</strong>
            </div>
            <div className="iw-detail-row">
              <span>Status</span>
              <strong>{selected.status}</strong>
            </div>
            <div className="iw-detail-row">
              <span>Date</span>
              <strong>{selected.date}</strong>
            </div>

            <button
              className="iw-remove-button"
              onClick={() => removeCredential(selected.id)}
            >
              Remove from demo wallet
            </button>
            <p className="iw-modal-note">
              This removes only the sample card from this page. It does not
              revoke an on-chain credential.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default IdentityWallet;
