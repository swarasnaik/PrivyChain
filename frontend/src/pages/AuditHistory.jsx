
import { useEffect, useState } from "react";
import "./AuditHistory.css";

function AuditHistory() {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState("All");

  const loadActivities = () => {
    const savedActivities = JSON.parse(
      localStorage.getItem("privychainActivity") || "[]"
    );

    setActivities(savedActivities);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filteredActivities =
    filter === "All"
      ? activities
      : activities.filter(
          (activity) => activity.status === filter
        );

  const clearHistory = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your demo activity history?"
    );

    if (confirmed) {
      localStorage.removeItem("privychainActivity");
      setActivities([]);
    }
  };

  return (
    <div className="audit-page">
      <div className="audit-header">
        <div>
          <p className="audit-eyebrow">TRANSPARENCY CENTER</p>
          <h1>Activity History</h1>
          <p className="audit-subtitle">
            Review decisions made about access to your credentials.
          </p>
        </div>

        <button
          className="audit-clear-btn"
          onClick={clearHistory}
          disabled={activities.length === 0}
        >
          Clear Demo History
        </button>
      </div>

      <div className="audit-stats">
        <div className="audit-stat-card">
          <span>Total Activities</span>
          <strong>{activities.length}</strong>
        </div>

        <div className="audit-stat-card">
          <span>Approved</span>
          <strong>
            {activities.filter((a) => a.status === "Approved").length}
          </strong>
        </div>

        <div className="audit-stat-card">
          <span>Rejected</span>
          <strong>
            {activities.filter((a) => a.status === "Rejected").length}
          </strong>
        </div>
      </div>

      <div className="audit-content">
        <div className="audit-toolbar">
          <div>
            <h2>Recent activity</h2>
            <p>Permission decisions recorded in this browser.</p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter activity"
          >
            <option value="All">All activities</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="audit-empty">
            <div className="audit-empty-icon">↗</div>
            <h3>No activity yet</h3>
            <p>
              Go to Permission Management and approve or reject a request.
              Your decision will appear here.
            </p>
          </div>
        ) : (
          <div className="audit-list">
            {filteredActivities.map((activity) => (
              <div className="audit-item" key={activity.id}>
                <div className="audit-item-icon">
                  {activity.status === "Approved" ? "✓" : "×"}
                </div>

                <div className="audit-item-main">
                  <h3>{activity.action}</h3>
                  <p>
                    {activity.organization} · {activity.credential}
                  </p>
                  <p className="audit-purpose">
                    Purpose: {activity.purpose}
                  </p>
                  <span className="audit-date">{activity.date}</span>
                </div>

                <span
                  className={`audit-status ${
                    activity.status === "Approved"
                      ? "audit-approved"
                      : "audit-rejected"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="audit-notice">
        <strong>Demo limitation:</strong> This history is stored in your
        browser. It is not yet a tamper-resistant blockchain audit log.
      </div>
    </div>
  );
}

export default AuditHistory;
