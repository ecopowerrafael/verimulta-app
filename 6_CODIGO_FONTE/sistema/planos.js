/**
 * VERIMULTA — Tabela de planos (fonte única).
 * servidor.js (limites e paywall) e pagamentos.js (checkout) leem DAQUI.
 * Manter os preços em dois lugares foi a causa do bug em que "Individual" e
 * "Casal" eram oferecidos no app mas recusados pelo checkout.
 */
const PLANOS = {
  gratis:       { nome: 'Grátis', preco: 0, veiculos: 1, cnhs: 1, defesas: false },
  individual:   { nome: 'Individual', preco: 29.90, veiculos: 2, cnhs: 1, defesas: true },
  casal:        { nome: 'Casal', preco: 49.90, veiculos: 3, cnhs: 2, defesas: true },
  empresa_start:{ nome: 'Empresa Start', preco: 89.90, veiculos: 5, cnhs: 2, defesas: true, pj: true },
  empresa_pro:  { nome: 'Empresa Pro', preco: 149.90, veiculos: 15, cnhs: 5, defesas: true, pj: true },
  frota:        { nome: 'Frota 10+', preco_veiculo: 11.90, veiculos: 999, defesas: true, pj: true }
};

/** Planos assináveis por valor fixo mensal (frota é por veículo — orçamento à parte). */
const PRECOS = Object.fromEntries(
  Object.entries(PLANOS).filter(([, p]) => p.preco > 0).map(([k, p]) => [k, p.preco])
);
const NOMES = Object.fromEntries(
  Object.keys(PRECOS).map(k => [k, `Verimulta ${PLANOS[k].nome}`])
);

/** Nunca deixa um plano desconhecido no banco derrubar a rota (cai para o grátis). */
function planoDe(chave) { return PLANOS[chave] || PLANOS.gratis; }

module.exports = { PLANOS, PRECOS, NOMES, planoDe };
