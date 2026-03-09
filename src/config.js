const BOOKS_BASE_URL = import.meta.env.VITE_BOOKS_URL || '/books';

export function getBookUrl(filename) {
  return `${BOOKS_BASE_URL}/${encodeURIComponent(filename)}`;
}
