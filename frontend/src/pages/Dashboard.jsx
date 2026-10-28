
import { Link } from "react-router-dom";
import "./dashboard.css";

const stats = [
  {
    label: "Digital Credentials",
    value: "03",
    detail: "Sample credentials",
    icon: "◈",
    color: "violet",
    link: "/identity",
  },
  {
    label: "Active Permissions",
    value: "04",
    detail: "Sample access grants",
    icon: "⌘",
    color: "green",
    link: "/permissions",
  },
  {
    label: "Pending Requests",
    value: "02",
    detail: "Review required",
    icon: "◷",
    color: "orange",
    link: "/permissions",
  },
  {
    label: "Recent Activities",
    value: "08",
    detail: "Sample records",
    icon: "↗",
    color: "blue",
    link: "/activity",
  },
];

const activities = [
  {
    icon: "◈",
    title: "Student credential viewed",
    description: "Identity Wallet",
    time: "Today",
    status: "Demo event",
  },
  {
    icon: "⌘",
    title: "Access request received",
    description: "Recruitment Platform",
    time: "Yesterday",
    status: "Pending review",
  },
  {
    icon: "✓",
    title: "Permission updated",
    description: "College Portal",
    time: "Yesterday",
    status: "Demo event",
  },
];

function Dashboard() {
  return (
    <div className="pc-dashboard">
      <section className="pc-welcome">
        <div className="pc-welcome-copy">
          <span className="pc-overline">
            YOUR PERSONAL IDENTITY SPACE
          </span>
          <h2>Welcome to PrivyChain <span>✦</span></h2>
          <p>
            Manage your digital credentials, control data access,
            and keep track of your identity activity.
          </p>
          <Link to="/identity" className="pc-main-button">
            Explore Identity Wallet <span>→</span>
          </Link>
        </div>

        <div className="pc-welcome-art" aria-hidden="true">
          <div className="pc-art-ring">
            <span>◈</span>
          </div>
          <div className="pc-art-orbit orbit-a" />
          <div className="pc-art-orbit orbit-b" />
          <span className="pc-art-star">✦</span>
        </div>
      </section>

      <section className="pc-stats-section">
        <div className="pc-section-heading">
          <div>
            <h3>Overview</h3>
            <p>Here's a snapshot of your identity workspace.</p>
          </div>
          <span className="pc-demo-label">DEMO DATA</span>
        </div>

        <div className="pc-stats-grid">
          {stats.map((stat) => (
            <Link
              to={stat.link}
              className="pc-stat-card"
              key={stat.label}
            >
              <div className="pc-stat-top">
                <span className={`pc-stat-icon ${stat.color}`}>
                  {stat.icon}
                </span>
                <span className="pc-stat-arrow">↗</span>
              </div>
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <span className="pc-stat-detail">{stat.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pc-dashboard-grid">
        <div className="pc-panel">
          <div className="pc-panel-heading">
            <div>
              <h3>Recent Activity</h3>
              <p>A quick look at identity-related events.</p>
            </div>
            <Link to="/activity" className="pc-view-link">
              View all →
            </Link>
          </div>

          <div className="pc-activity-list">
            {activities.map((activity, index) => (
              <div className="pc-activity-row" key={activity.title}>
                <div className={`pc-activity-icon activity-${index}`}>
                  {activity.icon}
                </div>

                <div className="pc-activity-info">
                  <strong>{activity.title}</strong>
                  <span>{activity.description}</span>
                </div>

                <div className="pc-activity-meta">
                  <span>{activity.time}</span>
                  <small>{activity.status}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pc-panel pc-actions-panel">
          <div className="pc-panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Go directly to a workspace.</p>
            </div>
          </div>

          <Link to="/identity" className="pc-action-row">
            <span className="pc-action-icon">◈</span>
            <span className="pc-action-copy">
              <strong>Identity Wallet</strong>
              <small>View digital credentials</small>
            </span>
            <span className="pc-action-arrow">→</span>
          </Link>

          <Link to="/permissions" className="pc-action-row">
            <span className="pc-action-icon green">⌘</span>
            <span className="pc-action-copy">
              <strong>Manage Permissions</strong>
              <small>Review access requests</small>
            </span>
            <span className="pc-action-arrow">→</span>
          </Link>

          <Link to="/activity" className="pc-action-row">
            <span className="pc-action-icon blue">↗</span>
            <span className="pc-action-copy">
              <strong>Activity History</strong>
              <small>Explore activity records</small>
            </span>
            <span className="pc-action-arrow">→</span>
          </Link>
        </div>
      </section>

      <div className="pc-privacy-note">
        <span className="pc-privacy-icon">◇</span>
        <div>
          <strong>Your privacy comes first</strong>
          <p>
            This prototype uses sample data. Real wallet connections,
            smart-contract permissions, and blockchain records are
            not yet connected.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
