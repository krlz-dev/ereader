import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import Reader from './pages/Reader';
import Login, { isAuthenticated } from './components/Login';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/book/:id" element={<BookDetail />} />
      <Route path="/read/:id" element={<Reader />} />
    </Routes>
  );
}
