
import { useState } from "react";
import "./Permissions.css";

const initialRequests = [
  {
    id: 1,
    organization: "TechNova Recruitment",
    credential: "Academic Certificate",
    purpose: "Internship application verification",
    requested: "Today",
    status: "Pending",
    icon: "💼",
  },
  {
    id: 2,
    organization: "University Portal",
    credential: "Student Identity",
    purpose: "Student status verification",
    requested: "Today",
    status: "Pending",
    icon: "🎓",
  },
  {
    id: 3,
    organization: "SkillVerify Platform",
    credential: "Academic Certificate",
    purpose: "Validate academic qualifications",
    requested: "Yesterday",
    status: "Approved",
    icon: "📋",
  },
];

function Permissions() {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("All");

  
const updateRequest = (id, newStatus) => {
  const selectedRequest = requests.find(
    (request) => request.id === id
  );

  if (!selectedRequest) return;

  setRequests((currentRequests) =>
    currentRequests.map((request) =>
      request.id === id
        ? { ...request, status: newStatus }
        : request
    )
  );

  const existingActivity = JSON.parse(
    localStorage.getItem("privychainActivity") || "[]"
  );

  const newActivity = {
    id: Date.now(),
    action:
      newStatus === "Approved"
        ? "Access Approved"
        : "Access Rejected",
    organization: selectedRequest.organization,
    credential: selectedRequest.credential,
    purpose: selectedRequest.purpose,
    status: newStatus,
    date: new Date().toLocaleString(),
  };

  localStorage.setItem(
    "privychainActivity",
    JSON.stringify([newActivity, ...existingActivity])
  );
};


  const filteredRequests =
    filter === "All"
      ? requests
      : requests.filter((request) => request.status === filter);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  return (
    <section className="permissions-page">
      <div className="pm-heading">
        <div>
          <span className="pm-eyebrow">ACCESS CONTROL CENTER</span>
          <h1>Permission Management</h1>
          <p>Decide who can access your digital credentials and why.</p>
        </div>

        <div className="pm-pending-counter">
          <span>{pendingCount}</span>
          <small>Pending requests</small>
        </div>
      </div>

      <div className="pm-privacy-banner">
        <span className="pm-banner-icon">🛡️</span>
        <div>
          <strong>Your data. Your decision.</strong>
          <p>
            Review each request before granting access to your information.
          </p>
        </div>
      </div>

      <div className="pm-toolbar">
        <div>
          <h2>Access Requests</h2>
          <p>Review the organization, requested credential, and purpose.</p>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter permission requests"
        >
          <option value="All">All requests</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="pm-request-list">
        {filteredRequests.map((request) => (
          <article className="pm-request-card" key={request.id}>
            <div className="pm-request-icon">{request.icon}</div>

            <div className="pm-request-content">
              <div className="pm-request-title">
                <h3>{request.organization}</h3>
                <span
                  className={`pm-status pm-${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>
              </div>

              <div className="pm-request-detail">
                <span>Credential requested</span>
                <strong>{request.credential}</strong>
              </div>

              <div className="pm-request-detail">
                <span>Purpose</span>
                <strong>{request.purpose}</strong>
              </div>

              <p className="pm-request-date">
                <span>◷</span> Received {request.requested}
              </p>

              {request.status === "Pending" ? (
                <div className="pm-actions">
                  <button
                    className="pm-approve"
                    onClick={() => updateRequest(request.id, "Approved")}
                  >
                    ✓ Approve Access
                  </button>
                  <button
                    className="pm-reject"
                    onClick={() => updateRequest(request.id, "Rejected")}
                  >
                    ✕ Reject
                  </button>
                </div>
              ) : (
                <div className="pm-decision-message">
                  {request.status === "Approved"
                    ? "Access approved in this demo. No real credential was shared."
                    : "Request rejected in this demo. No blockchain transaction was sent."}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="pm-empty">
          No requests found for this status.
        </div>
      )}

      <p className="pm-demo-note">
        Demo mode: decisions are held in frontend state and reset when the page
        reloads. Backend and smart-contract integration are not active yet.
      </p>
    </section>
  );
}

export default Permissions;
