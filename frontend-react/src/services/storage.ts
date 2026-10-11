import type { CredentialStorage, Usuario } from '../types/api';

export const webCredentialStorage: CredentialStorage = {
  read: () => {
    try {
      const raw = window.localStorage.getItem('vm_sessao');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { token?: unknown; usuario?: unknown };
      return typeof parsed.token === 'string' ? { token: parsed.token, usuario: parsed.usuario as Usuario | undefined } : null;
    } catch {
      return null;
    }
  },
  write: (session) => {
    try { window.localStorage.setItem('vm_sessao', JSON.stringify(session)); } catch { /* storage opcional */ }
  },
  clear: () => {
    try { window.localStorage.removeItem('vm_sessao'); } catch { /* storage opcional */ }
  }
};
