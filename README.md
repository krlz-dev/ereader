# ereader

A personal web-based ebook reader built for the joy of reading anywhere, on any device.

Browse your library, pick up where you left off, and enjoy a clean distraction-free reading experience — all from your browser.

## Features

- EPUB and PDF support with in-browser rendering
- Reading progress saved automatically (localStorage)
- Book cover extraction and display
- Table of contents navigation for EPUBs
- Page-by-page navigation with keyboard support
- Responsive design for desktop and mobile

## Tech Stack

- React 19 + Vite
- [epub.js](https://github.com/futurepress/epub.js) for EPUB rendering
- [pdf.js](https://github.com/nickmccurdy/pdfjs-dist) for PDF rendering
- Cloudflare R2 for book storage
- GitHub Pages for hosting

## Getting Started

```bash
npm install
npm run dev
```

Books go in the `books/` directory. The app picks them up automatically.

## Live

[krlz-dev.github.io/ereader](https://krlz-dev.github.io/ereader/)

---

Made by **Carlos Rojas**
