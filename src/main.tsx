import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const container = document.getElementById('root')!;
const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// index.html carries the prerendered home page; every other route is served
// app.html with an empty root (see staticwebapp.config.json).
if (container.firstElementChild && window.location.pathname === '/') hydrateRoot(container, tree);
else createRoot(container).render(tree);
