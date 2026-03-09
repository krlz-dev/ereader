import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Navbar() {
  const [showConfirm, setShowConfirm] = useState(false);
  const onLogout = useContext(AuthContext);

  const handleLogout = () => {
    sessionStorage.removeItem('ereader_auth');
    onLogout();
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
          </svg>
          eReader
        </Link>
        <button className="logout-btn" onClick={() => setShowConfirm(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {showConfirm && (
        <div className="logout-overlay" onClick={() => setShowConfirm(false)}>
          <div className="logout-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to logout?</p>
            <div className="logout-actions">
              <button className="logout-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="logout-confirm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
