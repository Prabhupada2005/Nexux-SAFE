import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Conditional PWA Registration
const path = window.location.pathname;
if (path === '/' || path.startsWith('/consumer') || path.startsWith('/login') || path.startsWith('/register')) {
  registerSW({ 
    immediate: true,
    onRegistered(r) {
      console.log('✅ SAFE PWA Service Worker Registered');
    },
    onRegisterError(error) {
      console.error('❌ SAFE PWA Registration Failed', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)