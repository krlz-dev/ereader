import { useEffect, useState } from 'react';
import ePub from 'epubjs';

const coverCache = new Map();
const failedCache = new Set();

function useBookCover(book) {
  const [coverUrl, setCoverUrl] = useState(() => coverCache.get(book.file) || null);
  const [loading, setLoading] = useState(!coverCache.has(book.file) && !failedCache.has(book.file));

  useEffect(() => {
    if (coverCache.has(book.file)) {
      setCoverUrl(coverCache.get(book.file));
      setLoading(false);
      return;
    }
    if (failedCache.has(book.file)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function extractCover() {
      try {
        if (book.type === 'epub') {
          const epubBook = ePub(`/books/${encodeURIComponent(book.file)}`);
          const url = await epubBook.coverUrl();
          if (!cancelled && url) {
            coverCache.set(book.file, url);
            setCoverUrl(url);
          } else {
            failedCache.add(book.file);
          }
        } else if (book.type === 'pdf') {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.mjs',
            import.meta.url
          ).toString();

          const url = `/books/${encodeURIComponent(book.file)}`;
          const pdf = await pdfjsLib.getDocument({ url, verbosity: 0 }).promise;
          const page = await pdf.getPage(1);
          const unscaled = page.getViewport({ scale: 1 });
          // Scale to ~300px wide for thumbnails
          const scale = 300 / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          if (!cancelled) {
            coverCache.set(book.file, dataUrl);
            setCoverUrl(dataUrl);
          }
          pdf.destroy();
        }
      } catch (e) {
        console.warn(`Cover extraction failed for: ${book.file}`, e.message);
        failedCache.add(book.file);
      }
      if (!cancelled) setLoading(false);
    }

    extractCover();
    return () => { cancelled = true; };
  }, [book.file, book.type]);

  return { coverUrl, loading };
}

export default function BookCover({ book, size = 'small' }) {
  const { coverUrl, loading } = useBookCover(book);
  const isLarge = size === 'large';

  if (coverUrl) {
    if (isLarge) {
      return (
        <div className="cover-large cover-large-has-img">
          <img src={coverUrl} alt={book.title} className="cover-large-img" />
        </div>
      );
    }
    return (
      <div
        className="cover"
        style={{
          background: `url(${coverUrl}) center/cover no-repeat`,
        }}
      >
        <span className="type-badge">{book.type.toUpperCase()}</span>
      </div>
    );
  }

  // Fallback: colored cover with title text
  return (
    <div
      className={isLarge ? 'cover-large' : 'cover'}
      style={{ background: book.color }}
    >
      <span className={isLarge ? '' : 'cover-title'}>
        {loading ? '' : book.title}
      </span>
      {!isLarge && <span className="type-badge">{book.type.toUpperCase()}</span>}
    </div>
  );
}
