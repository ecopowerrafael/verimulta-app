export type Plan = 'gratis' | string;

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  plano: Plan;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface Veiculo {
  id: number;
  placa: string;
  renavam?: string | null;
  modelo?: string | null;
  criado_em?: string;
}

export interface Multa {
  id: number;
  ait: string | null;
  orgao: string | null;
  enquadramento?: string | null;
  descricao: string | null;
  valor: number | null;
  pontos: number | null;
  data_infracao?: string | null;
  prazo_defesa: string | null;
  origem?: 'agente' | 'radar' | string;
}

export interface CamposMulta {
  ait?: string | null;
  orgao?: string | null;
  descricao?: string | null;
  enquadramento?: string | null;
  valor?: string | number | null;
  pontos?: string | number | null;
  data_infracao?: string | null;
  data_notificacao?: string | null;
  prazo_defesa?: string | null;
  origem?: 'agente' | 'radar' | string | null;
  observacao?: string | null;
  [key: string]: unknown;
}

export interface LeituraDocumento {
  leu: boolean;
  motivo?: string;
  orientacao: string;
  origem?: string;
  confianca?: number | null;
  campos_extraidos?: number;
  revisar?: string[];
  campos: CamposMulta;
}

export interface Verificacao {
  codigo: string;
  vicio: boolean;
  aplicavel?: boolean;
  detalhe: string;
  [key: string]: unknown;
}

export interface Diagnostico {
  multa: { id: number; ait: string | null; orgao: string | null; valor: number | null; prazo_defesa: string | null };
  verificacoes: Verificacao[];
  indice: string;
  vicios_encontrados: number;
  probabilidade: number | null;
  faixa: string;
  nota_correlacao: string;
  paywall: { mensagem: string; planos: string } | null;
  disclaimer: string;
}

export interface Recurso {
  id: number;
  multa_id: number;
  tipo: string;
  status: string;
  desfecho: 'deferido' | 'indeferido' | null;
  criado_em: string;
}

export interface DefesaCriada {
  recurso_id: number;
  tipo: string;
  texto: string;
  orientacao: string;
}

export interface PlanoDetalhe {
  nome: string;
  preco: number;
  preco_veiculo?: number;
  veiculos?: number;
  cnhs?: number;
  dependentes?: number;
  defesas: boolean;
  placa_terceiro?: boolean;
  pj?: boolean;
  usuarios?: number;
}

export type Planos = Record<string, PlanoDetalhe>;

export interface CheckoutResposta {
  modo: 'demo' | 'mercadopago' | string;
  plano: string;
  valor?: number;
  checkout_url?: string;
  aviso?: string;
  referencia?: string;
}

export type HttpStatus = 400 | 401 | 402 | 403 | 404 | 409 | 413 | 429 | 500 | number;

export interface CredentialStorage {
  read(): { token: string; usuario?: Usuario } | null;
  write(session: { token: string; usuario?: Usuario }): void;
  clear(): void;
}

export class ApiError extends Error {
  readonly status: HttpStatus;
  readonly payload: Record<string, unknown>;

  constructor(status: HttpStatus, payload: Record<string, unknown> = {}) {
    super(typeof payload.erro === 'string' ? payload.erro : `Falha na API (${status}).`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
