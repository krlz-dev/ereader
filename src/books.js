const BOOKS_JSON_URL =
  (import.meta.env.VITE_BOOKS_URL || '/books') + '/books.json';

const COLORS = [
  '#4A6FA5', '#E07A5F', '#81B29A', '#F2CC8F', '#3D405B',
  '#6D597A', '#B56576', '#355070', '#EAAC8B', '#E56B6F',
  '#2A9D8F', '#E9C46A', '#264653', '#F4A261', '#606C38',
  '#DDA15E', '#BC6C25', '#283618', '#FEFAE0', '#6B705C',
];

let _books = null;
let _promise = null;

export async function loadBooks() {
  if (_books) return _books;
  if (_promise) return _promise;

  _promise = fetch(BOOKS_JSON_URL)
    .then((res) => res.json())
    .then((data) => {
      _books = data.map((b, i) => ({
        ...b,
        id: i,
        color: COLORS[i % COLORS.length],
      }));
      return _books;
    });

  return _promise;
}

export function getBooks() {
  return _books || [];
}

export function getBook(id) {
  return (_books || []).find((b) => b.id === Number(id));
}
