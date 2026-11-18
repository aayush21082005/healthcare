import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      path: "/",
      name: "Dashboard",
      icon: "▦",
    },
    {
      path: "/patients",
      name: "Patient Data",
      icon: "♙",
    },
    {
      path: "/upload",
      name: "Upload Data",
      icon: "↑",
    },
    {
      path: "/prediction",
      name: "Prediction",
      icon: "✦",
    },
    {
      path: "/analytics",
      name: "Analytics",
      icon: "◫",
    },
    {
      path: "/history",
      name: "History",
      icon: "◷",
    },
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">
          +
        </div>

        <div>
          <h2>HealthPredict</h2>
          <p>Patient Outcome AI</p>
        </div>
      </div>


      <div className="menu-title">
        MAIN MENU
      </div>


      <nav className="sidebar-menu">

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span>
              {item.name}
            </span>
          </NavLink>
        ))}

      </nav>


      <div className="sidebar-bottom">

        <div className="system-status">
          <span className="online-dot"></span>

          <div>
            <strong>System Online</strong>
            <small>Frontend active</small>
          </div>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;