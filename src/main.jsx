// src/main.jsx or src/index.jsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // ✅ Bootstrap CSS
import './index.css'; // ✅ Optional: your custom CSS (ensure it's not Tailwind-based)
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
