import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

function Layout() {
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

            <div className="user-avatar">
              A
            </div>

            <div>
              <strong>Department User</strong>
              <small>Healthcare Department</small>
            </div>

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