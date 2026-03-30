import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminPanel from './AdminPanel.tsx' // Make sure this path matches where you saved it!
import './index.css'

// The "Zero-Dependency Router"
const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/admin' ? <AdminPanel /> : <App />}
  </React.StrictMode>,
)