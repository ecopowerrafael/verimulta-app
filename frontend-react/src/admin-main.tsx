import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminApp } from './pages/admin/AdminApp';
import './styles/admin.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
