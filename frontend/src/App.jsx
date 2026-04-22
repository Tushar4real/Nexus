import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Auth } from '@components/Auth';
import { ThemeProvider } from '@context/ThemeContext';
import { AppShell } from '@components/AppShell';
import Analytics from '@pages/Analytics';
import Dashboard from '@pages/Dashboard';
import Profile from '@pages/Profile';
import Tasks from '@pages/Tasks';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, loading, signup, login, logout, error, configError } = useAuth();

  if (loading) {
    return (
      <div className="status-screen">
        <div className="status-card status-card-compact">
          <div className="status-brand">NEXUS</div>
          <div className="status-copy">Loading...</div>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="status-screen">
        <div className="status-card">
          <div className="status-brand">NEXUS</div>
          <div className="status-kicker">Configuration Error</div>
          <p className="status-copy">
            {configError}
          </p>
          <div className="status-box">
            <h3 className="status-box-title">Quick Setup</h3>
            <ol className="status-list">
              <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
              <li>Create a new project</li>
              <li>Enable email/password authentication</li>
              <li>Create the `profiles` and `tasks` tables with RLS</li>
              <li>Add credentials to <code>.env</code></li>
            </ol>
          </div>
          <div className="status-box status-command">
            <div>cp frontend/.env.example .env</div>
            <div># Edit the repo root .env with your Supabase credentials</div>
          </div>
          <p className="status-footnote">
            See <strong>docs/SETUP.md</strong> for detailed instructions
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSignup={signup} onLogin={login} authWarning={error} />;
  }

  return (
    <Routes>
      <Route element={<AppShell user={user} onLogout={logout} authWarning={error} />}>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/tasks" element={<Tasks user={user} />} />
        <Route path="/analytics" element={<Analytics user={user} />} />
        <Route path="/profile" element={<Profile user={user} onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
