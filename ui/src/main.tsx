import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { applyTheme, getStoredTheme } from '@/lib/utils/theme';
import './index.css';

// Applied once at bootstrap so the saved theme shows on every route,
// including ones that don't render <ThemeToggle> (e.g. /connect).
applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
