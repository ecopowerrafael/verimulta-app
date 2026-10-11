import { ApiError, type CredentialStorage, type HttpStatus } from '../types/api';

export interface ApiClientOptions {
  baseUrl?: string;
  storage: CredentialStorage;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
  body?: BodyInit | null;
  binary?: boolean;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly storage: CredentialStorage;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = (options.baseUrl ?? '').replace(/\/$/, '');
    this.storage = options.storage;
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.timeoutMs);
    const headers = new Headers(options.headers);
    const session = this.storage.read();
    if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);

    let body = options.body;
    if (options.json !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.json);
    }

    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...options,
        body,
        headers,
        signal: controller.signal
      });
      if (response.status === 401) this.storage.clear();
      if (!response.ok) throw new ApiError(response.status as HttpStatus, await this.readJson(response));
      if (options.binary) return (await response.blob()) as T;
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError(408, { erro: 'A API demorou demais para responder.' });
      throw new ApiError(0, { erro: 'Não foi possível conectar ao servidor.' });
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }

  private async readJson(response: Response): Promise<Record<string, unknown>> {
    return await response.json().catch(() => ({}));
  }
}

export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? '';
}
