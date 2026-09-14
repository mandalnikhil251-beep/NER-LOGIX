function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { name: "Dashboard", icon: "🏠" },
    { name: "Live Map", icon: "🗺️" },
    { name: "Vehicles", icon: "🚚" },
    { name: "Alerts & Risk", icon: "⚠️" },
    { name: "Field Reports", icon: "📍" },
    { name: "Essential Logistics", icon: "📦" },
    { name: "AI Route Intelligence", icon: "🧠" },
    { name: "Weather", icon: "🌦️" },
    { name: "Analytics", icon: "📊" },
    {name: "Command Center",icon: "🏛️"},
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        <div>
          <h2>NER-LOGIX</h2>
          <span>Smart Logistics</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`sidebar-item ${
              activePage === item.name ? "active" : ""
            }`}
            onClick={() => setActivePage(item.name)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`sidebar-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => setActivePage("Settings")}
        >
          <span className="sidebar-icon">⚙️</span>
          <span>Settings</span>
        </button>

        <div className="sidebar-version">
          NER-LOGIX v1.0
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;