import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

function Layout({ user, onLogout }) {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-area">

        <header className="topbar">

          <div>
            <span className="topbar-label">
              HEALTHCARE ANALYTICS SYSTEM
            </span>
          </div>

          <div className="user-area">

            <div className="user-avatar" aria-hidden="true">
              {user?.username?.slice(0, 1).toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.username}</strong>
              <small>Authorized user</small>
            </div>

            <button
              className="secondary-button logout-button"
              onClick={onLogout}
              type="button"
            >
              Sign out
            </button>

          </div>

        </header>


        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default Layout;