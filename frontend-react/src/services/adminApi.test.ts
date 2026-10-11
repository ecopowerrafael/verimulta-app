import { describe, expect, it, vi } from 'vitest';
import { AdminApi, AdminAuthError } from './adminApi';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('AdminApi', () => {
  it('usa somente o cabeçalho administrativo e desabilita cache', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ usuarios: 1 }));
    const api = new AdminApi('segredo-de-teste', fetcher);

    await api.summary();

    expect(fetcher).toHaveBeenCalledWith('/v1/admin/resumo', expect.objectContaining({
      cache: 'no-store',
      credentials: 'omit',
      headers: expect.objectContaining({ 'x-admin-secret': 'segredo-de-teste', Accept: 'application/json' }),
    }));
    expect(fetcher.mock.calls[0]?.[0]).not.toContain('segredo-de-teste');
  });

  it.each([401, 403] as const)('converte %s em erro de autorização seguro', async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ erro: 'não autorizado' }, status));
    const api = new AdminApi('segredo-de-teste', fetcher);

    await expect(api.summary()).rejects.toEqual(expect.objectContaining({ name: 'AdminAuthError', status }));
    await expect(api.summary()).rejects.toThrow('acesso não autorizado');
  });

  it('limpa a credencial da memória e impede novas requisições', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({}));
    const api = new AdminApi('segredo-de-teste', fetcher);
    api.clear();

    await expect(api.summary()).rejects.toThrow('Acesso administrativo encerrado.');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('usa os contratos e métodos reais das tarefas administrativas', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response({ ok: true }));
    const api = new AdminApi('segredo-de-teste', fetcher);

    await api.feedbacks();
    await api.runDeadlines();
    await api.runPlateScan();

    expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
      ['/v1/admin/feedbacks', 'GET'],
      ['/v1/admin/tarefas/prazos', 'POST'],
      ['/v1/admin/tarefas/varredura', 'POST'],
    ]);
  });

  it('preserva os campos reais das tabelas e aceita listas vazias', async () => {
    const payload = {
      usuarios: 0,
      assinantes: 0,
      mrr: 0,
      multas: 0,
      recursos: 0,
      ultimos_usuarios: [],
      pagamentos: [],
      ultimas_multas: [],
      emails: [],
      varreduras: [],
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(payload));
    const api = new AdminApi('segredo-de-teste', fetcher);

    await expect(api.summary()).resolves.toEqual(payload);
  });
});
