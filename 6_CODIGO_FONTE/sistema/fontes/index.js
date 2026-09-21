/**
 * VERIMULTA — camada de fontes de dados externas.
 *
 * O problema real não é código: é contrato. As bases oficiais (RENAVAM,
 * RENACH, RENAINF) só abrem com autorização no SENATRAN mais contratação do
 * Serpro — não existe chave que se compre no cartão e ligue hoje.
 *
 * A resposta de engenharia para isso é esta camada: o app conversa com uma
 * INTERFACE, não com um fornecedor. No dia em que o contrato sair, liga-se a
 * fonte por configuração, sem tocar em servidor.js, monitor.js ou nas telas.
 *
 * Contrato que toda fonte cumpre:
 *   nome          string
 *   rotulo        string legível para o Painel do Dono
 *   oficial       true só quando a origem é a base do órgão
 *   fornece       ['veiculo'|'multas'|'cnh'|'debitos'|'valor_fipe']
 *   ativa()       boolean — está configurada?
 *   motivo()      string — por que não está ativa
 *   consultar(p)  Promise<{ok, dados, erro}>  — p: {placa, renavam, cpf, ...}
 *
 * Regra da casa, valendo aqui também: fonte que não responde devolve
 * `ok:false`. NUNCA devolve dado inventado para preencher a tela.
 */
const fipe = require('./fipe');
const configuravel = require('./configuravel');
const demonstracao = require('./demonstracao');

const TODAS = [fipe, configuravel, demonstracao];

/** Fontes efetivamente ligadas neste ambiente. */
function ativas() { return TODAS.filter(f => f.ativa()); }

/** Fontes que declaram fornecer um tipo de informação. */
function paraTipo(tipo) { return ativas().filter(f => f.fornece.includes(tipo)); }

/**
 * Consulta a primeira fonte ativa que fornece o tipo pedido.
 * Devolve sempre a mesma forma, com a origem declarada — a tela precisa poder
 * dizer ao usuário de onde veio o número.
 */
async function consultar(tipo, parametros = {}) {
  const candidatas = paraTipo(tipo);
  if (!candidatas.length) {
    return {
      ok: false, tipo, origem: null,
      erro: 'nenhuma_fonte_ativa',
      mensagem: `Nenhuma fonte de "${tipo}" está ligada. ` +
        'As bases oficiais dependem de autorização no SENATRAN e contratação do Serpro.'
    };
  }
  for (const fonte of candidatas) {
    try {
      const r = await fonte.consultar(parametros);
      if (r && r.ok) {
        return { ok: true, tipo, origem: fonte.nome, oficial: fonte.oficial,
                 rotulo: fonte.rotulo, dados: r.dados };
      }
    } catch (e) {
      // Fonte externa fora do ar não pode derrubar a rota: tenta a próxima.
      console.error(`[fontes] ${fonte.nome} falhou:`, e.message);
    }
  }
  return {
    ok: false, tipo, origem: null, erro: 'consulta_falhou',
    mensagem: 'As fontes ligadas não responderam agora. Tente de novo mais tarde.'
  };
}

/** Retrato do que está ligado — vai para o Painel do Dono e para /v1/fontes. */
function estado() {
  return TODAS.map(f => ({
    nome: f.nome, rotulo: f.rotulo, oficial: f.oficial,
    fornece: f.fornece, ativa: f.ativa(), motivo: f.ativa() ? null : f.motivo()
  }));
}

module.exports = { TODAS, ativas, paraTipo, consultar, estado };
