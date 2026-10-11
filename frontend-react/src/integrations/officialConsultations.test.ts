import { describe, expect, it } from 'vitest';
import { officialConsultations } from './officialConsultations';

describe('consultas oficiais', () => {
  it('preserva os sete links governamentais definidos no HTML legado', () => {
    const urls = officialConsultations.flatMap((group) => group.items.map(([, url]) => url));
    expect(urls).toHaveLength(7);
    expect(new Set(urls).size).toBe(7);
    expect(urls).toContain('https://portalservicos.senatran.serpro.gov.br');
    expect(urls).toContain('https://www.detran.sp.gov.br');
    expect(urls).toContain('https://portal.fazenda.sp.gov.br/servicos/ipva');
  });
});
