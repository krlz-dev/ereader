const HISTORY_KEY = 'ereader_history';
const PROGRESS_KEY = 'ereader_progress';

// --- Reading History (recently opened books) ---

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

/** Add a book to history. Keeps last 20 entries, most recent first. */
export function addToHistory(bookId) {
  const history = getHistory().filter((h) => h.id !== bookId);
  history.unshift({ id: bookId, openedAt: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

// --- Reading Progress (page / location per book) ---

function getAllProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

/** Save reading position for a book.
 *  For EPUB: location is a CFI string (from rendition.currentLocation()).
 *  For PDF:  location is the page number.
 */
export function saveProgress(bookId, location) {
  const all = getAllProgress();
  all[bookId] = { location, updatedAt: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

/** Get saved reading position for a book. Returns { location, updatedAt } or null. */
export function getProgress(bookId) {
  return getAllProgress()[bookId] || null;
}
