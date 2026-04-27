import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const Auth = ({ onSignup, onLogin, authWarning = '' }) => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const deletedMessage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('deleted') === 'true'
      ? 'Your workspace data was removed. Goodbye for now.'
      : '';
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await onSignup(email, password, name);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card anim-enter">
        <div className="auth-header">
          <p className="page-kicker">Clarity OS</p>
          <div className="auth-brand">Execution, not clutter.</div>
          <div className="auth-subtitle">Plan classes, assignments, exams, and deadlines in one premium workspace.</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {deletedMessage && !error && (
            <div className="auth-message" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.28)', color: '#0f766e' }}>
              {deletedMessage}
            </div>
          )}

          {authWarning && !error && (
            <div className="auth-message auth-message-warning">
              {authWarning}
            </div>
          )}

          {!isLogin && (
            <label className="auth-field">
              <span className="auth-label">Full Name</span>
              <input
                className="auth-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
              />
            </label>
          )}
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="auth-message auth-message-warning">{error}</div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="auth-switch"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
