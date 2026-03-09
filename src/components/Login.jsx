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
        <input
          type="text"
          placeholder="user"
          value={user}
          onChange={(e) => { setUser(e.target.value); setError(false); }}
          autoFocus
        />
        <input
          type="password"
          placeholder="pass"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setError(false); }}
        />
        {error && <div className="login-error">access denied</div>}
        <button type="submit">enter</button>
      </form>
    </div>
  );
}
