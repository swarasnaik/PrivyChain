
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../workspace.css";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/identity": "Identity Wallet",
  "/permissions": "Permissions",
  "/activity": "Activity History",
};

function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="workspace">
      <Sidebar />

      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="breadcrumb">PRIVYCHAIN / WORKSPACE</p>
            <h1>{title}</h1>
          </div>

          <Link to="/" className="back-home">
            ← Home
          </Link>
        </header>

        <div className="workspace-content">
          <Outlet />
        </div>

        <footer className="workspace-footer">
          PrivyChain · Your Identity. Your Data. Your Rules.
          <span>Demo mode · Sample data</span>
        </footer>
      </main>
    </div>
  );
}

export default Layout;
