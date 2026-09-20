/**
 * VERIMULTA — Tabela de planos (fonte única).
 * servidor.js (limites e paywall) e pagamentos.js (checkout) leem DAQUI.
 * Manter os preços em dois lugares foi a causa do bug em que o plano oferecido
 * no app era recusado pelo checkout.
 *
 * Grade oficial (Manual de Instalação, etapa 4 — "Cliente pagou → plano liberado"):
 *   combo1 29,90 · combo2 39,90 · combo3 49,90 · empresa_start 89,90
 *   empresa_pro 149,90 · frota sob proposta (R$ 11,90/veículo)
 */
const PLANOS = {
  gratis:        { nome: 'Grátis',        preco: 0,      veiculos: 1,   cnhs: 1, dependentes: 0, defesas: false },
  combo1:        { nome: 'Combo 01',      preco: 29.90,  veiculos: 2,   cnhs: 1, dependentes: 0, defesas: true, placa_terceiro: true },
  combo2:        { nome: 'Combo 02',      preco: 39.90,  veiculos: 2,   cnhs: 2, dependentes: 1, defesas: true, placa_terceiro: true },
  combo3:        { nome: 'Combo 03',      preco: 49.90,  veiculos: 3,   cnhs: 3, dependentes: 2, defesas: true, placa_terceiro: true },
  empresa_start: { nome: 'Empresa Start', preco: 89.90,  veiculos: 5,   cnhs: 2, usuarios: 2, defesas: true, pj: true },
  empresa_pro:   { nome: 'Empresa Pro',   preco: 149.90, veiculos: 15,  cnhs: 5, usuarios: 5, defesas: true, pj: true },
  frota:         { nome: 'Frota 10+',     preco_veiculo: 11.90, veiculos: 999, defesas: true, pj: true }
};

/**
 * Chaves antigas que podem estar gravadas em `usuarios.plano` de contas criadas
 * antes da grade oficial. Sem isto, planoDe() derrubaria um assinante pagante
 * para o grátis silenciosamente. Mapeadas pelo preço equivalente.
 */
const ALIASES = { individual: 'combo1', casal: 'combo3' };

/** Planos assináveis por valor fixo mensal (frota é por veículo — orçamento à parte). */
const PRECOS = Object.fromEntries(
  Object.entries(PLANOS).filter(([, p]) => p.preco > 0).map(([k, p]) => [k, p.preco])
);
const NOMES = Object.fromEntries(
  Object.keys(PRECOS).map(k => [k, `Verimulta ${PLANOS[k].nome}`])
);

/** Resolve alias legado → chave atual. */
function chaveDe(chave) { return ALIASES[chave] || chave; }

/** Nunca deixa um plano desconhecido no banco derrubar a rota (cai para o grátis). */
function planoDe(chave) { return PLANOS[chaveDe(chave)] || PLANOS.gratis; }

/** Preço mensal efetivo de um plano gravado no banco — base do MRR. */
function precoDe(chave) { return PRECOS[chaveDe(chave)] || 0; }

module.exports = { PLANOS, PRECOS, NOMES, ALIASES, planoDe, precoDe, chaveDe };
