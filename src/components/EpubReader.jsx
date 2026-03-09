import { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { saveProgress, getProgress } from '../readingHistory';

export default function EpubReader({ file, bookId }) {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState({ current: 0, total: 0 });
  const [pageInputVal, setPageInputVal] = useState(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const book = ePub(file);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    });

    renditionRef.current = rendition;

    const saved = getProgress(bookId);
    const startLocation = saved?.location || undefined;

    let ready = false;

    const displayReady = rendition.display(startLocation);
    const locationsReady = book.ready.then(() => book.locations.generate(1024));

    book.loaded.navigation.then((nav) => {
      setToc(nav.toc || []);
    });

    Promise.all([displayReady, locationsReady]).then(() => {
      ready = true;
      const loc = rendition.currentLocation();
      if (loc?.start) {
        setPageInfo({
          current: loc.start.location + 1,
          total: book.locations.length(),
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    rendition.on('relocated', (location) => {
      if (location?.start?.cfi) {
        saveProgress(bookId, location.start.cfi);
      }
      if (ready && location?.start?.location != null && book.locations.length()) {
        setPageInfo({
          current: location.start.location + 1,
          total: book.locations.length(),
        });
      }
    });

    rendition.themes.default({
      body: {
        'font-family': "'IBM Plex Sans', sans-serif !important",
        'line-height': '1.7 !important',
        padding: '0 8px !important',
      },
      p: { 'margin-bottom': '0.8em !important' },
      img: { 'max-width': '100% !important' },
    });

    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') rendition.next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') rendition.prev();
    };
    document.addEventListener('keydown', handleKey);
    rendition.on('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      book.destroy();
    };
  }, [file, bookId]);

  const goNext = useCallback(() => renditionRef.current?.next(), []);
  const goPrev = useCallback(() => renditionRef.current?.prev(), []);

  const goToChapter = useCallback((href) => {
    renditionRef.current?.display(href);
    setShowToc(false);
  }, []);

  return (
    <>
      {loading && <div className="loading">Preparing book...</div>}
      <div
        ref={viewerRef}
        id="epub-viewer"
        style={{ visibility: loading ? 'hidden' : 'visible' }}
      />

      <div className={`reader-nav ${loading ? 'reader-nav-loading' : ''}`}>
        <button onClick={() => renditionRef.current?.display(0)} title="First page" disabled={loading}>⟨⟨</button>
        <button onClick={goPrev} disabled={loading}>Previous</button>
        {pageInfo.total > 0 ? (
          <span className="page-input-wrap">
            <input
              type="text"
              inputMode="numeric"
              className="page-input"
              value={pageInputVal ?? pageInfo.current}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setPageInputVal(''); return; }
                const val = parseInt(raw, 10);
                if (!isNaN(val)) setPageInputVal(val);
              }}
              onBlur={() => {
                const val = parseInt(pageInputVal, 10);
                const target = (val >= 1 && val <= pageInfo.total) ? val : 1;
                if (bookRef.current?.locations) {
                  const cfi = bookRef.current.locations.cfiFromLocation(target - 1);
                  if (cfi) renditionRef.current?.display(cfi);
                }
                setPageInputVal(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            />
            <span>/ {pageInfo.total}</span>
          </span>
        ) : (
          <span className="nav-loading-text">{loading ? 'Loading...' : ''}</span>
        )}
        <button onClick={() => setShowToc(true)} style={{ background: '#f0c040', fontWeight: 600 }} disabled={loading}>
          Contents
        </button>
        <button onClick={goNext} disabled={loading}>Next</button>
        <button onClick={() => { const total = bookRef.current?.locations?.length(); if (total) renditionRef.current?.display(bookRef.current.locations.cfiFromLocation(total - 1)); }} title="Last page" disabled={loading}>⟩⟩</button>
      </div>

      {showToc && (
        <div className="toc-overlay" onClick={() => setShowToc(false)}>
          <div className="toc-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Table of Contents</h3>
            <ul>
              {toc.map((item, i) => (
                <li key={i}>
                  <a onClick={() => goToChapter(item.href)}>{item.label}</a>
                </li>
              ))}
              {toc.length === 0 && (
                <li style={{ color: '#888' }}>No table of contents available</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
