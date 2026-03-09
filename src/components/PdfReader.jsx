import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { saveProgress, getProgress } from '../readingHistory';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export default function PdfReader({ file, bookId }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNum, setPageNum] = useState(() => {
    const saved = getProgress(bookId);
    return saved?.location || 1;
  });
  const [totalPages, setTotalPages] = useState(0);
  const [pageInputVal, setPageInputVal] = useState(null);
  const pdfDocRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        // Try decoded URL first (handles commas, spaces naturally)
        const decodedUrl = decodeURIComponent(file);
        let pdf;
        try {
          pdf = await pdfjsLib.getDocument({
            url: decodedUrl,
            isEvalSupported: false,
            enableXfa: false,
            verbosity: 0,
          }).promise;
        } catch {
          // Fallback to encoded URL
          pdf = await pdfjsLib.getDocument({
            url: file,
            isEvalSupported: false,
            enableXfa: false,
            verbosity: 0,
          }).promise;
        }
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.warn('PDF load error:', err.message);
          setError(`Could not open this PDF: ${err.message}`);
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pdfDocRef.current || !containerRef.current) return;
    let cancelled = false;

    async function renderPage() {
      try {
        const pdf = pdfDocRef.current;
        const page = await pdf.getPage(pageNum);
        if (cancelled) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth - 32;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch (err) {
        console.warn('PDF render error:', err.message);
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pageNum, totalPages]);

  // Save progress whenever page changes
  useEffect(() => {
    if (pageNum > 0) {
      saveProgress(bookId, pageNum);
    }
  }, [pageNum, bookId]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40, textAlign: 'center' }}>
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" strokeWidth="1.5">
          <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <p style={{ fontSize: 15, color: '#888', maxWidth: 400 }}>{error}</p>
        <p style={{ fontSize: 13, color: '#aaa' }}>This PDF may be corrupted or use an unsupported format.</p>
      </div>
    );
  }

  return (
    <>
      {loading && <div className="loading">Loading PDF...</div>}
      <div ref={containerRef} className="pdf-viewer" />
      {totalPages > 0 && (
        <div className="reader-nav">
          <button onClick={() => setPageNum(1)} disabled={pageNum <= 1} title="First page">⟨⟨</button>
          <button onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum <= 1}>
            Previous
          </button>
          <span className="page-input-wrap">
            <input
              type="text"
              inputMode="numeric"
              className="page-input"
              value={pageInputVal ?? pageNum}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') { setPageInputVal(''); return; }
                const val = parseInt(raw, 10);
                if (!isNaN(val)) setPageInputVal(val);
              }}
              onBlur={() => {
                const val = parseInt(pageInputVal, 10);
                if (val >= 1 && val <= totalPages) setPageNum(val);
                else setPageNum(1);
                setPageInputVal(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            />
            <span>/ {totalPages}</span>
          </span>
          <button
            onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
            disabled={pageNum >= totalPages}
          >
            Next
          </button>
          <button onClick={() => setPageNum(totalPages)} disabled={pageNum >= totalPages} title="Last page">⟩⟩</button>
        </div>
      )}
    </>
  );
}
