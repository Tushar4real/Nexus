import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Auth } from '@components/Auth';
import { ThemeProvider } from '@context/ThemeContext';
import { AppShell } from '@components/AppShell';
import Dashboard from '@pages/Dashboard';
import {
  AnalyticsPlaceholder,
  ProfilePlaceholder,
  TasksPlaceholder
} from '@pages/RoutePlaceholders';

const shellStyles = {
  screen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    color: 'var(--text-primary)',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '600px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '32px',
    textAlign: 'center'
  },
  brand: {
    fontSize: '32px',
    fontWeight: '800',
    letterSpacing: '-0.05em',
    marginBottom: '12px'
  },
  muted: {
    color: 'var(--text-secondary)'
  },
  setupBox: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'left',
    marginBottom: '20px'
  }
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, loading, signup, login, logout, error } = useAuth();

  if (loading) {
    return (
      <div style={shellStyles.screen}>
        <div style={{ textAlign: "center" }}>
          <div className="mono" style={shellStyles.brand}>
            NEXUS
          </div>
          <div style={shellStyles.muted}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={shellStyles.screen}>
        <div style={shellStyles.card}>
          <div className="mono" style={shellStyles.brand}>
            NEXUS
          </div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
            Configuration Error
          </h2>
          <p style={{ ...shellStyles.muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            {error}
          </p>
          <div style={shellStyles.setupBox}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
              Quick Setup:
            </h3>
            <ol style={{ ...shellStyles.muted, fontSize: '13px', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li>Create a new project</li>
              <li>Enable Authentication (Email/Password)</li>
              <li>Create Firestore Database</li>
              <li>Add credentials to <code className="mono">.env</code></li>
            </ol>
          </div>
          <div className="mono" style={{ ...shellStyles.setupBox, fontSize: '12px', marginBottom: 0 }}>
            <div>cp .env.example .env</div>
            <div style={{ marginTop: "4px" }}># Edit .env with your Firebase credentials</div>
          </div>
          <p style={{ ...shellStyles.muted, fontSize: '12px', marginTop: '20px' }}>
            See <strong>docs/SETUP.md</strong> for detailed instructions
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSignup={signup} onLogin={login} />;
  }

  return (
    <Routes>
      <Route element={<AppShell user={user} onLogout={logout} />}>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/tasks" element={<TasksPlaceholder />} />
        <Route path="/analytics" element={<AnalyticsPlaceholder />} />
        <Route path="/profile" element={<ProfilePlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
