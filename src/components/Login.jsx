import { useState } from 'react';

const VALID_USER = import.meta.env.VITE_AUTH_USER || '';
const VALID_PASS = import.meta.env.VITE_AUTH_PASS || '';

export function isAuthenticated() {
  return sessionStorage.getItem('ereader_auth') === 'true';
}

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === VALID_USER && pass === VALID_PASS) {
      sessionStorage.setItem('ereader_auth', 'true');
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-logo">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#e63956" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>ereader</span>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => { setUser(e.target.value); setError(false); }}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setError(false); }}
        />
        {error && <div className="login-error">Invalid credentials</div>}
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
