import { useState, useRef, useEffect } from 'react';
import BookCover from './BookCover';

export default function LazyBookCover({ book, size = 'small' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isLarge = size === 'large';

  if (!visible) {
    return (
      <div
        ref={ref}
        className={isLarge ? 'cover-large' : 'cover'}
        style={{
          background: book.color,
          width: '100%',
          height: isLarge ? 400 : 280,
        }}
      />
    );
  }

  return (
    <div ref={ref}>
      <BookCover book={book} size={size} />
    </div>
  );
}
