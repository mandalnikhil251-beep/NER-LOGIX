function Header({ activePage }) {
  return (
    <header className="top-header">
      <div>
        <h1>NER-LOGIX</h1>

        <p>
          {activePage} • AI-Powered Logistics & Accessibility Intelligence
        </p>
      </div>

      <div className="header-right">

        <span className="system-status">
          ● System Online
        </span>

        <button className="notification-btn">
          🔔
        </button>

        <div className="user-profile">

          <div className="user-avatar">
            A
          </div>

          <div>
            <strong>Admin</strong>
            <small>Control Center</small>
          </div>

        </div>

      </div>
    </header>
  );
}

export default Header;