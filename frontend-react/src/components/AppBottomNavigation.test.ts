import { describe, expect, it } from 'vitest';
import { activeFor } from './AppBottomNavigation';

describe('seção ativa da navegação principal', () => {
  it('mantém Rede ativa nas telas de rede e parceiro', () => {
    expect(activeFor('network', 'network')).toBe(true);
    expect(activeFor('partner', 'network')).toBe(true);
  });

  it('mantém Verificar ativa durante a jornada da multa', () => {
    expect(activeFor('scan', 'scan')).toBe(true);
    expect(activeFor('diagnosis', 'scan')).toBe(true);
  });
});
