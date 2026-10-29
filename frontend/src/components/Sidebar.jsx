import { NavLink, Link } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/identity", label: "Identity Wallet" },
  { to: "/permissions", label: "Permissions" },
  { to: "/activity", label: "Activity History" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">PrivyChain</Link>
      <p className="sidebar-heading">WORKSPACE</p>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;