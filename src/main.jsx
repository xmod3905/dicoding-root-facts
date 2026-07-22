import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ Service Worker terdaftar:', reg.scope))
      .catch((err) => console.error('❌ Registrasi Service Worker gagal:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
