import type { CredentialStorage, Usuario, VeiculoPendente } from '../types/api';

const pendingVehicleKey = (userId: number) => `vm_veiculo_pendente_${userId}`;

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

export const pendingVehicleStorage = {
  read: (userId: number): VeiculoPendente | null => {
    try {
      const raw = window.localStorage.getItem(pendingVehicleKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { placa?: unknown; modelo?: unknown };
      return typeof parsed.placa === 'string' && parsed.placa.trim()
        ? { placa: parsed.placa.trim().toUpperCase(), modelo: typeof parsed.modelo === 'string' ? parsed.modelo : undefined }
        : null;
    } catch {
      return null;
    }
  },
  write: (userId: number, vehicle: VeiculoPendente): void => {
    try {
      window.localStorage.setItem(pendingVehicleKey(userId), JSON.stringify({ placa: vehicle.placa.trim().toUpperCase(), modelo: vehicle.modelo }));
    } catch { /* storage opcional */ }
  },
  clear: (userId: number): void => {
    try { window.localStorage.removeItem(pendingVehicleKey(userId)); } catch { /* storage opcional */ }
  }
};
