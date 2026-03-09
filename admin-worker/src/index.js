const KNOWN_AUTHORS = {
  'Designing Data-Intensive Applications': 'Martin Kleppmann',
  'Grokking Algorithms': 'Aditya Bhargava',
  'Building Microservices, 2nd Edition': 'Sam Newman',
  'Clean Code Collection': 'Robert C. Martin',
  'Software Architecture - The Hard Parts': 'Neal Ford, Mark Richards',
  'Masters Of Doom': 'David Kushner',
  'Blood, Sweat, And Pixels': 'Jason Schreier',
  'AI Engineering': 'Chip Huyen',
};

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(':');
  return user === env.AUTH_USER && pass === env.AUTH_PASS;
}

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  return response;
}

async function getBooksList(env) {
  const obj = await env.BUCKET.get('books.json');
  if (!obj) return [];
  return await obj.json();
}

async function saveBooksList(env, books) {
  await env.BUCKET.put('books.json', JSON.stringify(books, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    // Serve admin page
    if (url.pathname === '/' || url.pathname === '') {
      if (!checkAuth(request, env)) return unauthorized();
      return cors(new Response(ADMIN_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }));
    }

    // API: list books
    if (url.pathname === '/api/books' && request.method === 'GET') {
      if (!checkAuth(request, env)) return cors(unauthorized());
      const books = await getBooksList(env);
      return cors(new Response(JSON.stringify(books), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // API: upload book
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      if (!checkAuth(request, env)) return cors(unauthorized());

      const formData = await request.formData();
      const file = formData.get('file');
      const author = formData.get('author') || '';

      if (!file || !file.name) {
        return cors(new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 }));
      }

      const filename = file.name;
      const type = filename.endsWith('.pdf') ? 'pdf' : 'epub';
      const title = filename.replace(/\.(epub|pdf)$/i, '');

      // Upload to R2
      await env.BUCKET.put(filename, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      // Update books.json
      const books = await getBooksList(env);
      const exists = books.find(b => b.file === filename);
      if (!exists) {
        books.push({ file: filename, title, author, type });
        await saveBooksList(env, books);
      }

      return cors(new Response(JSON.stringify({ ok: true, title }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // API: delete book
    if (url.pathname === '/api/delete' && request.method === 'POST') {
      if (!checkAuth(request, env)) return cors(unauthorized());

      const { file } = await request.json();
      if (!file) {
        return cors(new Response(JSON.stringify({ error: 'No file specified' }), { status: 400 }));
      }

      await env.BUCKET.delete(file);

      const books = await getBooksList(env);
      const updated = books.filter(b => b.file !== file);
      await saveBooksList(env, updated);

      return cors(new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    return cors(new Response('Not found', { status: 404 }));
  },
};

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Library Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body { background: #0d0d0d; color: #e0e0e0; min-height: 100vh; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; }
    .table { color: #ccc; }
    .table th { color: #c8a800; border-color: #333; }
    .table td { border-color: #222; vertical-align: middle; }
    .btn-outline-warning { color: #c8a800; border-color: #c8a800; }
    .btn-outline-warning:hover { background: #c8a800; color: #000; }
    .btn-outline-danger:hover { background: #dc3545; color: #fff; }
    .form-control, .form-control:focus { background: #111; color: #ccc; border-color: #333; }
    .form-control:focus { border-color: #c8a800; box-shadow: 0 0 0 .2rem rgba(200,168,0,.15); }
    .badge-epub { background: #198754; }
    .badge-pdf { background: #dc3545; }
    h4 { color: #c8a800; }
    .upload-zone { border: 2px dashed #333; border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.3s; }
    .upload-zone:hover, .upload-zone.dragover { border-color: #c8a800; }
    .spinner-border { width: 1rem; height: 1rem; }
    .toast-container { z-index: 9999; }
  </style>
</head>
<body>
  <div class="container py-4" style="max-width: 800px;">
    <h4 class="mb-4">Library Admin</h4>

    <div class="card mb-4 p-3">
      <div class="upload-zone" id="dropZone">
        <p class="mb-2">Drop .epub or .pdf files here, or click to select</p>
        <input type="file" id="fileInput" accept=".epub,.pdf" multiple class="d-none">
        <input type="text" id="authorInput" class="form-control mt-2" placeholder="Author (optional)" style="max-width: 300px; margin: 0 auto;">
        <button class="btn btn-outline-warning btn-sm mt-3" id="uploadBtn" disabled>
          Upload
        </button>
      </div>
      <div id="uploadProgress" class="mt-2"></div>
    </div>

    <div class="card p-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span id="bookCount" class="text-muted small"></span>
        <input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Search..." style="max-width: 200px;">
      </div>
      <div class="table-responsive">
        <table class="table table-sm mb-0">
          <thead>
            <tr><th>Title</th><th>Author</th><th>Type</th><th></th></tr>
          </thead>
          <tbody id="bookList"></tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="toast" class="toast" role="alert">
      <div class="toast-body" id="toastMsg"></div>
    </div>
  </div>

  <div class="modal fade" id="deleteModal" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
      <div class="modal-content" style="background: #1a1a1a; border: 1px solid #333;">
        <div class="modal-body text-center py-4">
          <p class="mb-1">Delete this book?</p>
          <p class="text-muted small mb-3" id="deleteFileName"></p>
          <button class="btn btn-sm btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-sm btn-danger" id="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    const creds = btoa(prompt('Enter credentials (user:pass):', ''));
    const headers = { 'Authorization': 'Basic ' + creds };

    let books = [];
    let deleteFile = null;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    async function loadBooks() {
      const res = await fetch('/api/books', { headers });
      if (res.status === 401) { alert('Invalid credentials'); location.reload(); return; }
      books = await res.json();
      renderBooks();
    }

    function renderBooks(filter = '') {
      const q = filter.toLowerCase();
      const filtered = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
      document.getElementById('bookCount').textContent = filtered.length + ' of ' + books.length + ' books';
      document.getElementById('bookList').innerHTML = filtered.map(b =>
        '<tr>' +
        '<td>' + esc(b.title) + '</td>' +
        '<td class="text-muted small">' + esc(b.author) + '</td>' +
        '<td><span class="badge badge-' + b.type + '">' + b.type.toUpperCase() + '</span></td>' +
        '<td><button class="btn btn-outline-danger btn-sm py-0 px-1" onclick="askDelete(\\''+esc(b.file)+'\\')">×</button></td>' +
        '</tr>'
      ).join('');
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function showToast(msg) {
      document.getElementById('toastMsg').textContent = msg;
      bootstrap.Toast.getOrCreateInstance(document.getElementById('toast')).show();
    }

    window.askDelete = function(file) {
      deleteFile = file;
      document.getElementById('deleteFileName').textContent = file;
      deleteModal.show();
    };

    document.getElementById('confirmDelete').onclick = async () => {
      deleteModal.hide();
      await fetch('/api/delete', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ file: deleteFile }) });
      showToast('Deleted: ' + deleteFile);
      loadBooks();
    };

    // Upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    let selectedFiles = [];

    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); selectedFiles = [...e.dataTransfer.files].filter(f => f.name.match(/\\.(epub|pdf)$/i)); updateUploadBtn(); };
    fileInput.onchange = () => { selectedFiles = [...fileInput.files]; updateUploadBtn(); };

    function updateUploadBtn() {
      uploadBtn.disabled = selectedFiles.length === 0;
      uploadBtn.textContent = selectedFiles.length ? 'Upload ' + selectedFiles.length + ' file(s)' : 'Upload';
    }

    uploadBtn.onclick = async () => {
      uploadBtn.disabled = true;
      const author = document.getElementById('authorInput').value.trim();
      const prog = document.getElementById('uploadProgress');

      for (let i = 0; i < selectedFiles.length; i++) {
        const f = selectedFiles[i];
        prog.innerHTML = '<span class="spinner-border spinner-border-sm text-warning me-2"></span>Uploading ' + (i+1) + '/' + selectedFiles.length + ': ' + f.name;
        const fd = new FormData();
        fd.append('file', f);
        fd.append('author', author);
        await fetch('/api/upload', { method: 'POST', headers, body: fd });
      }

      prog.innerHTML = '<span class="text-success">Done!</span>';
      selectedFiles = [];
      fileInput.value = '';
      updateUploadBtn();
      document.getElementById('authorInput').value = '';
      setTimeout(() => prog.innerHTML = '', 2000);
      loadBooks();
    };

    document.getElementById('searchInput').oninput = (e) => renderBooks(e.target.value);

    loadBooks();
  </script>
</body>
</html>`;
