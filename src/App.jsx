import { Routes, Route } from 'react-router-dom';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import Reader from './pages/Reader';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Library />} />
      <Route path="/book/:id" element={<BookDetail />} />
      <Route path="/read/:id" element={<Reader />} />
    </Routes>
  );
}
