export type AdminUser = {
  nome: string | null;
  email: string | null;
  plano: string | null;
  criado_em: string;
};

export type AdminPayment = {
  evento: string | null;
  plano: string | null;
  valor: number | string | null;
  status: string | null;
};

export type AdminFine = {
  ait: string | null;
  orgao: string | null;
  valor: number | string | null;
  origem: string | null;
};

export type AdminEmail = {
  tipo: string | null;
  para: string | null;
  enviado: string | null;
};

export type AdminScan = {
  fonte: string | null;
  placas_verificadas: number | null;
  novas_multas: number | null;
  criado_em: string;
};

export type AdminSummary = {
  usuarios: number;
  assinantes: number;
  mrr: number;
  multas: number;
  recursos: number;
  ultimos_usuarios: AdminUser[];
  pagamentos: AdminPayment[];
  ultimas_multas: AdminFine[];
  emails: AdminEmail[];
  varreduras: AdminScan[];
};

export type AdminFeedback = {
  id: number | string;
  tela: string | null;
  nota: number | null;
  texto: string | null;
  versao: string | null;
  criado_em: string;
  nome: string | null;
  email: string | null;
};

export type AdminFeedbackSummary = {
  total: number;
  nota_media: number | null;
  por_tela: Array<[string, number]>;
  itens: AdminFeedback[];
};

export type AdminTaskResult = Record<string, unknown>;
