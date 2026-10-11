import { afterEach, describe, expect, it, vi } from 'vitest';
import { pendingVehicleStorage } from './storage';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }
  };
}

describe('pendingVehicleStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('persiste a pendência por usuário e normaliza a placa', () => {
    vi.stubGlobal('window', { localStorage: memoryStorage() });
    pendingVehicleStorage.write(7, { placa: 'abc1d23', modelo: 'Meu veículo' });

    expect(pendingVehicleStorage.read(7)).toEqual({ placa: 'ABC1D23', modelo: 'Meu veículo' });
    expect(pendingVehicleStorage.read(8)).toBeNull();
  });

  it('limpa somente a pendência do usuário informado', () => {
    vi.stubGlobal('window', { localStorage: memoryStorage() });
    pendingVehicleStorage.write(7, { placa: 'ABC1D23' });
    pendingVehicleStorage.write(8, { placa: 'XYZ9A88' });

    pendingVehicleStorage.clear(7);

    expect(pendingVehicleStorage.read(7)).toBeNull();
    expect(pendingVehicleStorage.read(8)).toEqual({ placa: 'XYZ9A88', modelo: undefined });
  });
});
