import { createContext, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import Reader from './pages/Reader';
import Login, { isAuthenticated } from './components/Login';

export const AuthContext = createContext();

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
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
