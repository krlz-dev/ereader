import { createContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import Reader from './pages/Reader';
import Login, { isAuthenticated } from './components/Login';
import { loadBooks } from './books';

export const AuthContext = createContext();

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authed) {
      loadBooks().then(() => setReady(true));
    }
  }, [authed]);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  if (!ready) {
    return <div className="loading">Loading library...</div>;
  }

  return (
    <AuthContext.Provider value={() => setAuthed(false)}>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/book/:id" element={<BookDetail />} />
        <Route path="/read/:id" element={<Reader />} />
      </Routes>
    </AuthContext.Provider>
  );
}
