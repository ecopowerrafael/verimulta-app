import { describe, expect, it, vi } from 'vitest';
import { consultPublicPlate, isValidBrazilianPlate, normalizePlate } from './publicLanding';

describe('public landing contracts', () => {
  it('normaliza e valida placas antigas e Mercosul', () => {
    expect(normalizePlate(' abc-1d23 ')).toBe('ABC1D23');
    expect(isValidBrazilianPlate('ABC1D23')).toBe(true);
    expect(isValidBrazilianPlate('ABC1234')).toBe(true);
    expect(isValidBrazilianPlate('AB123')).toBe(false);
  });

  it('consome a consulta pública real sem colocar a placa em HTML', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      placa: 'ABC1D23', consulta_oficial: false, situacao: 'nao_conectada', aviso: 'pendente',
    }), { status: 200 }));
    await expect(consultPublicPlate('abc-1d23', fetcher)).resolves.toMatchObject({ consulta_oficial: false });
    expect(fetcher).toHaveBeenCalledWith('/v1/consulta-placa/ABC1D23', expect.objectContaining({ cache: 'no-store' }));
  });

  it('distingue placa inválida e rate limit', async () => {
    await expect(consultPublicPlate('INVALID')).rejects.toThrow('formato ABC1D23');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 429 }));
    await expect(consultPublicPlate('ABC1D23', fetcher)).rejects.toThrow('Muitas consultas');
  });
});
