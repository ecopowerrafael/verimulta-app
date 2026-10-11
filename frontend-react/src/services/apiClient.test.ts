import { describe, expect, it } from 'vitest';
import { ApiClient } from './apiClient';
import { ApiError, type CredentialStorage } from '../types/api';

const storage = (): CredentialStorage => { let session: { token: string } | null = { token: 'jwt' }; return { read: () => session, write: (v) => { session = v; }, clear: () => { session = null; } }; };

describe('ApiClient', () => {
  it('envia JSON e token e retorna o contrato', async () => {
    let request: RequestInit | undefined;
    const client = new ApiClient({ storage: storage(), fetcher: async (_url, init) => { request = init; return new Response(JSON.stringify({ ok: true }), { status: 200 }); } });
    await expect(client.request<{ ok: boolean }>('/v1/auth/login', { method: 'POST', json: { email: 'a@b.com' } })).resolves.toEqual({ ok: true });
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer jwt');
    expect(new Headers(request?.headers).get('Content-Type')).toBe('application/json');
  });

  it.each([401, 402, 403, 409, 413, 429, 500])('propaga HTTP %s como erro e limpa sessão em 401', async (status) => {
    const saved = storage();
    const client = new ApiClient({ storage: saved, fetcher: async () => new Response(JSON.stringify({ erro: 'falhou' }), { status }) });
    await expect(client.request('/v1/test')).rejects.toBeInstanceOf(ApiError);
    if (status === 401) expect(saved.read()).toBeNull();
  });
});
