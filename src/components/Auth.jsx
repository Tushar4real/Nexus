import { useState } from 'react';
import { C } from '@utils/constants';
import { FInput, Btn } from '@components/UI';

export const Auth = ({ onSignup, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: C.bg, padding: "20px"
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "14px", padding: "32px",
        width: "100%", maxWidth: "420px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: "28px", fontWeight: "700",
            color: C.accent, letterSpacing: "-1px",
            marginBottom: "8px"
          }}>
            NEXUS
          </div>
          <div style={{
            color: C.t2, fontSize: "13px",
            fontWeight: "600", letterSpacing: "1.5px"
          }}>
            PRODUCTIVITY OS
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <FInput
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter your name"
            />
          )}
          <FInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
          />
          <FInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {error && (
            <div style={{
              padding: "10px 12px", background: C.dangerBg,
              border: `1px solid ${C.danger}44`,
              borderRadius: "8px", color: C.danger,
              fontSize: "13px", marginBottom: "14px"
            }}>
              {error}
            </div>
          )}

          <Btn
            v="accent"
            disabled={loading}
            style={{ width: "100%", marginBottom: "12px" }}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Btn>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              width: "100%", background: "transparent",
              border: "none", color: C.t3,
              fontSize: "13px", cursor: "pointer",
              fontFamily: "inherit", padding: "8px"
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
