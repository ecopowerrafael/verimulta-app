import { ApiClient } from './apiClient';
import type { CamposMulta, CheckoutResposta, CnhResumo, DefesaCriada, Diagnostico, Feedback, LeituraDocumento, Multa, Planos, Recurso, Sessao, Usuario, Veiculo, VeiculoResumo } from '../types/api';

export const createVerimultaApi = (client: ApiClient) => ({
  login: (email: string, senha: string) => client.request<Sessao>('/v1/auth/login', { method: 'POST', json: { email, senha } }),
  register: (input: { nome: string; cpf: string; email: string; senha: string; consentimento: true }) =>
    client.request<Sessao & { consentimento_lgpd: { registrado: boolean; versao_termos: string; politica: string } }>('/v1/auth/register', { method: 'POST', json: input }),
  listVehicles: () => client.request<Veiculo[]>('/v1/veiculos'),
  createVehicle: (input: { placa: string; modelo?: string }) => client.request<Veiculo>('/v1/veiculos', { method: 'POST', json: input }),
  ensureVehicle: async (input: { placa: string; modelo?: string }) => {
    const placa = input.placa.trim().toUpperCase();
    const existing = (await client.request<Veiculo[]>('/v1/veiculos')).find((vehicle) => vehicle.placa.toUpperCase() === placa);
    return existing ?? client.request<Veiculo>('/v1/veiculos', { method: 'POST', json: { ...input, placa } });
  },
  vehicleSummary: (id: number) => client.request<VeiculoResumo>(`/v1/veiculos/${id}/resumo`),
  cnh: () => client.request<CnhResumo>('/v1/cnh'),
  updateCnh: (validade: string | null) => client.request<{ ok: boolean; cnh_validade: string | null }>('/v1/cnh', { method: 'POST', json: { validade } }),
  listFines: () => client.request<Multa[]>('/v1/multas'),
  readDocument: async (file: File): Promise<LeituraDocumento> => {
    const form = new FormData();
    form.append('foto', file);
    return client.request<LeituraDocumento>('/v1/multas/ler', { method: 'POST', body: form });
  },
  createFine: (fields: CamposMulta, vehicleId: number | undefined) =>
    client.request<{ multa_id: number; arquivo_recebido: boolean; proximo_passo: string }>('/v1/multas/scan', {
      method: 'POST',
      json: { ...fields, veiculo_id: vehicleId }
    }),
  diagnosis: (id: number) => client.request<Diagnostico>(`/v1/multas/${id}/diagnostico`),
  listResources: () => client.request<Recurso[]>('/v1/recursos'),
  createDefense: (fineId: number) => client.request<DefesaCriada>('/v1/recursos', { method: 'POST', json: { multa_id: fineId } }),
  downloadDefensePdf: (resourceId: number) => client.request<Blob>(`/v1/recursos/${resourceId}/pdf`, { binary: true }),
  listPlans: () => client.request<Planos>('/v1/planos'),
  checkout: (plan: string) => client.request<CheckoutResposta>('/v1/checkout', { method: 'POST', json: { plano: plan } }),
  cancelSubscription: () => client.request<{ ok: boolean; mensagem: string }>('/v1/assinaturas/cancelar', { method: 'POST', json: {} }),
  downloadPersonalData: () => client.request<Blob>('/v1/eu/dados', { binary: true }),
  deleteAccount: () => client.request<{ ok: boolean; mensagem: string }>('/v1/eu/conta', { method: 'DELETE' }),
  listFeedback: () => client.request<Feedback[]>('/v1/feedback'),
  createFeedback: (input: { tela: string; nota: number | null; texto: string }) => client.request<{ ok: boolean; id: number; mensagem: string }>('/v1/feedback', { method: 'POST', json: { tela: input.tela, ...(input.nota === null ? {} : { nota: input.nota }), texto: input.texto } }),
  userFromSession: (token: string): Usuario | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { id?: number; email?: string };
      return payload.id && payload.email ? { id: payload.id, email: payload.email, nome: '', plano: 'gratis' } : null;
    } catch { return null; }
  }
});
