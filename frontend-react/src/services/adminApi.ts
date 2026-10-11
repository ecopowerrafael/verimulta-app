import type { AdminFeedbackSummary, AdminSummary, AdminTaskResult } from '../types/admin';

type Fetcher = typeof fetch;

export class AdminAuthError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403) {
    super('Chave administrativa inválida ou acesso não autorizado.');
    this.name = 'AdminAuthError';
    this.status = status;
  }
}

export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super('Não foi possível carregar o painel administrativo.');
    this.name = 'AdminApiError';
    this.status = status;
  }
}

export class AdminApi {
  private secret: string | null;
  private readonly fetcher: Fetcher;
  private readonly baseUrl: string;

  constructor(secret: string, fetcher: Fetcher = fetch, baseUrl = '') {
    this.secret = secret;
    this.fetcher = fetcher;
    this.baseUrl = baseUrl;
  }

  clear(): void {
    this.secret = null;
  }

  async summary(): Promise<AdminSummary> {
    return this.request<AdminSummary>('/v1/admin/resumo');
  }

  async feedbacks(): Promise<AdminFeedbackSummary> {
    return this.request<AdminFeedbackSummary>('/v1/admin/feedbacks');
  }

  async runDeadlines(): Promise<AdminTaskResult> {
    return this.request<AdminTaskResult>('/v1/admin/tarefas/prazos', { method: 'POST' });
  }

  async runPlateScan(): Promise<AdminTaskResult> {
    return this.request<AdminTaskResult>('/v1/admin/tarefas/varredura', { method: 'POST' });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.secret) {
      throw new Error('Acesso administrativo encerrado.');
    }

    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        ...(init.headers ?? {}),
        'x-admin-secret': this.secret,
        Accept: 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminAuthError(response.status);
    }
    if (!response.ok) {
      throw new AdminApiError(response.status);
    }

    return response.json() as Promise<T>;
  }
}
