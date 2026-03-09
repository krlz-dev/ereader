import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook } from '../books';
import { getBookUrl } from '../config';
import { addToHistory } from '../readingHistory';
import EpubReader from '../components/EpubReader';
import PdfReader from '../components/PdfReader';

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = getBook(id);

  useEffect(() => {
    if (book) addToHistory(book.id);
  }, [book?.id]);

  if (!book) return <div className="loading">Book not found</div>;

  return (
    <div className="reader-page">
      <div className="reader-toolbar">
        <button onClick={() => navigate(`/book/${book.id}`)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="title">{book.title}</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="reader-container">
        {book.type === 'epub' ? (
          <EpubReader file={getBookUrl(book.file)} bookId={book.id} />
        ) : (
          <PdfReader file={getBookUrl(book.file)} bookId={book.id} />
        )}
      </div>
    </div>
  );
}
