import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '@context/ThemeContext';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="2" />
        <rect x="13" y="4" width="7" height="11" rx="2" />
        <rect x="4" y="13" width="7" height="7" rx="2" />
        <rect x="13" y="17" width="7" height="3" rx="1.5" />
      </svg>
    )
  },
  {
    to: '/tasks',
    label: 'Tasks',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 7h10" />
        <path d="M8 12h10" />
        <path d="M8 17h10" />
        <path d="M4 7h.01" />
        <path d="M4 12h.01" />
        <path d="M4 17h.01" />
      </svg>
    )
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </svg>
    )
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    )
  }
];

const ThemeButton = ({ mobile = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle${mobile ? ' mobile-only' : ''}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="mono">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
    </button>
  );
};

export const AppShell = ({ user, onLogout }) => {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div>
            <div className="app-brand">NEXUS</div>
            <div className="app-subtitle mono">PRODUCTIVITY</div>
          </div>
          <ThemeButton />
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar mono">
              {(user?.name || 'User')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="profile-copy">
              <div className="profile-name">{user?.name || 'User'}</div>
              <div className="profile-email mono">{user?.email || 'Signed in'}</div>
            </div>
          </div>
          <button type="button" className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="app-main">
        <ThemeButton mobile />
        <main className="app-content">
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}
              aria-label={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
