
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home.jsx";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import IdentityWallet from "./pages/IdentityWallet.jsx";
import Permissions from "./pages/Permissions.jsx";
import AuditHistory from "./pages/AuditHistory.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/identity" element={<IdentityWallet />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/activity" element={<AuditHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
