import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// GitHub Pages SPA redirect handler
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  const path = redirect.replace('/ereader', '');
  if (path && path !== '/') {
    window.history.replaceState(null, '', '/ereader' + path);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/ereader">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
