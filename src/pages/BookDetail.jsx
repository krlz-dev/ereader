import { useParams, useNavigate } from 'react-router-dom';
import { getBook } from '../books';
import { getProgress, getHistory } from '../readingHistory';
import LazyBookCover from '../components/LazyBookCover';
import Navbar from '../components/Navbar';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = getBook(id);
  const progress = getProgress(Number(id));
  const historyEntry = getHistory().find((h) => h.id === Number(id));

  if (!book) return <div className="loading">Book not found</div>;

  return (
    <>
      <Navbar />

      <div className="detail-page">
        <button className="detail-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>

        <div className="detail-layout">
          <div className="detail-cover-wrap">
            <LazyBookCover book={book} size="large" />
          </div>

          <div className="detail-content">
            <div className="category">{book.type === 'epub' ? 'EPUB Book' : 'PDF Document'}</div>
            <h1>{book.title}</h1>
            <div className="author">{book.author || book.type.toUpperCase() + ' Format'}</div>

            <div className="detail-meta">
              <div className="meta-item">
                <span className="label">Format</span>
                <span className="value">{book.type.toUpperCase()}</span>
              </div>
              <div className="meta-item">
                <span className="label">Status</span>
                <span className="value">{progress ? 'In Progress' : 'Not Started'}</span>
              </div>
              {progress && book.type === 'pdf' && (
                <div className="meta-item">
                  <span className="label">Last Page</span>
                  <span className="value">Page {progress.location}</span>
                </div>
              )}
              {historyEntry && (
                <div className="meta-item">
                  <span className="label">Last Read</span>
                  <span className="value">{timeAgo(historyEntry.openedAt)}</span>
                </div>
              )}
            </div>

            <p className="description">
              Click "Read Now" to open this {book.type.toUpperCase()} book in the reader.
              {book.type === 'epub'
                ? ' Navigate with arrow keys or the page buttons. Access the table of contents from the Contents button.'
                : ' Navigate page by page with the Previous and Next buttons.'}
            </p>

            <div className="detail-actions">
              <button className="read-btn" onClick={() => navigate(`/read/${book.id}`)}>
                {progress ? 'Continue Reading' : 'Read Now'}
              </button>
              <button className="bookmark-btn">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
