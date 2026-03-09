import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { books, getBook } from '../books';
import { getHistory } from '../readingHistory';
import LazyBookCover from '../components/LazyBookCover';
import Navbar from '../components/Navbar';

// Category definitions with regex matchers
const CATEGORIES = [
  { key: 'scala', label: 'Scala', match: /scala|sbt/i, color: '#DC322F' },
  { key: 'java', label: 'Java & Spring', match: /java|spring/i, color: '#F89820' },
  { key: 'js', label: 'JavaScript & React', match: /javascript|react|angular|frontend/i, color: '#F7DF1E' },
  { key: 'arch', label: 'Architecture', match: /architect|microservice|design pattern|distributed|event.driven/i, color: '#4A6FA5' },
  { key: 'haskell', label: 'Haskell', match: /haskell|yesod/i, color: '#5E5086' },
  { key: 'devops', label: 'DevOps & Cloud', match: /devops|aws|cloud|kafka|docker/i, color: '#FF9900' },
  { key: 'cs', label: 'Algorithms & CS', match: /algorithm|machine learning|artificial|computer science/i, color: '#27ae60' },
  { key: 'lit', label: 'Literature', match: /poem|feminist|doom|dietland|intrusion|muscle|men explain|siutico/i, color: '#8B3A62' },
];

// Count books per category
const categoryCounts = (() => {
  const counts = {};
  CATEGORIES.forEach((c) => { counts[c.key] = 0; });
  books.forEach((b) => {
    for (const c of CATEGORIES) {
      if (c.match.test(b.title)) { counts[c.key]++; break; }
    }
  });
  return counts;
})();

const epubCount = books.filter((b) => b.type === 'epub').length;
const pdfCount = books.filter((b) => b.type === 'pdf').length;

function tooltip(book) {
  return book.author ? `${book.title}\nby ${book.author}` : book.title;
}

export default function Library() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = books;

    // Format filters
    if (activeFilter === 'epub') list = list.filter((b) => b.type === 'epub');
    else if (activeFilter === 'pdf') list = list.filter((b) => b.type === 'pdf');

    // Category filters
    const cat = CATEGORIES.find((c) => c.key === activeFilter);
    if (cat) list = list.filter((b) => cat.match.test(b.title));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeFilter, search]);

  const history = getHistory();
  const recentBooks = history.map((h) => getBook(h.id)).filter(Boolean).slice(0, 5);

  const activeLabel = activeFilter === 'all' ? 'All Books'
    : activeFilter === 'epub' ? 'E-books'
    : activeFilter === 'pdf' ? 'PDF Books'
    : CATEGORIES.find((c) => c.key === activeFilter)?.label || 'All Books';

  return (
    <>
      <Navbar />

      <div className="main-layout">
        {/* Left sidebar */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            {/* Search */}
            <div className="sidebar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value.trim()) setActiveFilter('all');
                }}
              />
            </div>

            <h3 className="sidebar-title">Filters</h3>

            {/* Format filters */}
            <div
              className={`filter-item${activeFilter === 'all' ? ' active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <div className="filter-dot" style={{ background: '#1a1a2e' }} />
              <span className="filter-label">All Books</span>
              <span className="filter-count">{books.length}</span>
            </div>
            <div
              className={`filter-item${activeFilter === 'epub' ? ' active' : ''}`}
              onClick={() => setActiveFilter('epub')}
            >
              <div className="filter-dot" style={{ background: '#e63956' }} />
              <span className="filter-label">E-books</span>
              <span className="filter-count">{epubCount}</span>
            </div>
            <div
              className={`filter-item${activeFilter === 'pdf' ? ' active' : ''}`}
              onClick={() => setActiveFilter('pdf')}
            >
              <div className="filter-dot" style={{ background: '#355070' }} />
              <span className="filter-label">PDF Books</span>
              <span className="filter-count">{pdfCount}</span>
            </div>

            <div className="filter-divider" />

            {/* Category filters */}
            {CATEGORIES.filter((c) => categoryCounts[c.key] > 0).map((c) => (
              <div
                key={c.key}
                className={`filter-item${activeFilter === c.key ? ' active' : ''}`}
                onClick={() => setActiveFilter(c.key)}
              >
                <div className="filter-dot" style={{ background: c.color }} />
                <span className="filter-label">{c.label}</span>
                <span className="filter-count">{categoryCounts[c.key]}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="main-content">
          {/* Continue Reading */}
          {recentBooks.length > 0 && (
            <div className="continue-section">
              <h3 className="section-title">Continue Reading</h3>
              <div className="continue-row">
                {recentBooks.map((book) => (
                  <Link key={book.id} to={`/read/${book.id}`} className="continue-card" title={tooltip(book)}>
                    <div className="continue-thumb" style={{ background: book.color }}>
                      <LazyBookCover book={book} size="thumb" />
                    </div>
                    <div className="continue-info">
                      <span className="continue-title">{book.title}</span>
                      {book.author && <span className="continue-author">{book.author}</span>}
                      <span className="continue-badge">Resume</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Books heading */}
          <div className="books-header">
            <h2 className="section-title">
              {search ? `Results for "${search}"` : activeLabel}
            </h2>
            <span className="books-count">{filtered.length} books</span>
          </div>

          {/* Books grid */}
          <div className="book-grid">
            {filtered.length === 0 && <div className="empty-state">No books found</div>}
            {filtered.map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="book-card" title={tooltip(book)}>
                <LazyBookCover book={book} />
                <div className="info">
                  <div className="title">{book.title}</div>
                  {book.author && <div className="author">{book.author}</div>}
                  <span className="card-badge">{book.type === 'epub' ? 'EPUB' : 'PDF'}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
