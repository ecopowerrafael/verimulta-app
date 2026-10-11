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

  it('notifica a aplicação apenas quando o 401 pertence à sessão atual', async () => {
    const saved = storage(); let invalidated = 0;
    const client = new ApiClient({ storage: saved, onSessionInvalidated: () => { invalidated += 1; }, fetcher: async () => {
      saved.write({ token: 'new-session' });
      return new Response(JSON.stringify({ erro: 'sessão antiga' }), { status: 401 });
    } });
    await expect(client.request('/v1/late')).rejects.toBeInstanceOf(ApiError);
    expect(saved.read()?.token).toBe('new-session');
    expect(invalidated).toBe(0);
  });

  it('não trata 401 do login como expiração de sessão existente', async () => {
    const saved: CredentialStorage = { read: () => null, write: () => undefined, clear: () => undefined }; let invalidated = 0;
    const client = new ApiClient({ storage: saved, onSessionInvalidated: () => { invalidated += 1; }, fetcher: async () => new Response('{}', { status: 401 }) });
    await expect(client.request('/v1/auth/login', { method: 'POST' })).rejects.toBeInstanceOf(ApiError);
    expect(invalidated).toBe(0);
  });
});
