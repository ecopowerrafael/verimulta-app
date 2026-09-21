/**
 * VERIMULTA — fonte HTTP configurável (o encaixe para o dia do contrato).
 *
 * POR QUE ELA EXISTE
 * As bases oficiais não têm chave à venda: o acesso ao RENAVAM/RENACH/RENAINF
 * exige autorização no SENATRAN e contrato com o Serpro. Cada fornecedor
 * autorizado entrega um endereço, um jeito de autenticar e um formato de
 * resposta diferentes. Escrever um cliente para um fornecedor específico
 * agora seria chutar o contrato dele.
 *
 * Então esta fonte não conhece fornecedor nenhum: ela lê do ambiente o
 * endereço, o cabeçalho de autenticação e um MAPA de campos. No dia em que o
 * contrato sair, preenche-se o `.env` com o que a documentação do fornecedor
 * disser — e o app passa a puxar dado de verdade sem uma linha nova.
 *
 * CONFIGURAÇÃO (tudo opcional; sem FONTE_HTTP_URL a fonte fica desligada)
 *   FONTE_HTTP_URL         https://api.fornecedor.br/veiculo/{placa}
 *   FONTE_HTTP_METODO      GET (padrão) ou POST
 *   FONTE_HTTP_CABECALHOS  {"Authorization":"Bearer XYZ"}
 *   FONTE_HTTP_CORPO       {"placa":"{placa}"}          (só em POST)
 *   FONTE_HTTP_RAIZ        dados.veiculo                (onde começa o objeto)
 *   FONTE_HTTP_MAPA        {"ait":"numeroAit","valor":"valorInfracao"}
 *   FONTE_HTTP_FORNECE     veiculo,multas,cnh,debitos
 *   FONTE_HTTP_ROTULO      Nome que aparece no Painel do Dono
 *   FONTE_HTTP_OFICIAL     true quando a origem é a base do órgão
 *
 * Marcadores aceitos na URL e no corpo: {placa} {renavam} {cpf} {chassi} {uf}
 */
const TEMPO_LIMITE = Number(process.env.FONTE_HTTP_TIMEOUT_MS || 12000);

const nome = 'http';
const rotulo = process.env.FONTE_HTTP_ROTULO || 'Fonte externa configurada';
const oficial = String(process.env.FONTE_HTTP_OFICIAL || '') === 'true';
const fornece = (process.env.FONTE_HTTP_FORNECE || 'veiculo,multas')
  .split(',').map(s => s.trim()).filter(Boolean);

function ativa() { return !!process.env.FONTE_HTTP_URL; }
function motivo() {
  return 'Nenhum fornecedor configurado. Defina FONTE_HTTP_URL e o cabeçalho de '
    + 'autenticação quando o contrato com a fonte oficial (Serpro/SENATRAN) sair.';
}

/** Lê JSON de variável de ambiente sem derrubar o boot se vier torto. */
function json(valor, padrao) {
  if (!valor) return padrao;
  try { return JSON.parse(valor); }
  catch (e) { console.error('[fontes/http] JSON inválido em configuração:', e.message); return padrao; }
}

/** Troca {placa}, {cpf}… pelos valores, já codificados para URL. */
function preencher(molde, p, paraUrl) {
  return String(molde).replace(/\{(\w+)\}/g, (_, chave) => {
    const v = p[chave] == null ? '' : String(p[chave]);
    return paraUrl ? encodeURIComponent(v) : v;
  });
}

/** Caminho com pontos: pega('a.b.0.c', obj). Devolve undefined se faltar. */
function pega(caminho, objeto) {
  return String(caminho).split('.').reduce((atual, parte) => {
    if (atual == null) return undefined;
    return atual[parte];
  }, objeto);
}

/** Aplica o MAPA. Sem mapa, devolve a resposta como veio. */
function traduzir(bruto, mapa) {
  if (!mapa || !Object.keys(mapa).length) return bruto;
  const traduzirUm = (item) => {
    const saida = {};
    for (const [nosso, deles] of Object.entries(mapa)) {
      const v = pega(deles, item);
      if (v !== undefined) saida[nosso] = v;
    }
    return saida;
  };
  return Array.isArray(bruto) ? bruto.map(traduzirUm) : traduzirUm(bruto);
}

async function consultar(p = {}) {
  if (!ativa()) return { ok: false, erro: 'nao_configurada' };

  const url = preencher(process.env.FONTE_HTTP_URL, p, true);
  const metodo = (process.env.FONTE_HTTP_METODO || 'GET').toUpperCase();
  const cabecalhos = { Accept: 'application/json', ...json(process.env.FONTE_HTTP_CABECALHOS, {}) };

  let corpo;
  if (metodo !== 'GET' && process.env.FONTE_HTTP_CORPO) {
    corpo = preencher(process.env.FONTE_HTTP_CORPO, p, false);
    cabecalhos['Content-Type'] = cabecalhos['Content-Type'] || 'application/json';
  }

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE);
  try {
    const r = await fetch(url, { method: metodo, headers: cabecalhos, body: corpo, signal: controle.signal });
    if (!r.ok) {
      console.error(`[fontes/http] ${metodo} respondeu ${r.status}`);
      return { ok: false, erro: `http_${r.status}` };
    }
    const bruto = await r.json();
    const raiz = process.env.FONTE_HTTP_RAIZ ? pega(process.env.FONTE_HTTP_RAIZ, bruto) : bruto;
    if (raiz === undefined) {
      console.error('[fontes/http] FONTE_HTTP_RAIZ não encontrou o caminho na resposta');
      return { ok: false, erro: 'raiz_nao_encontrada' };
    }
    return { ok: true, dados: traduzir(raiz, json(process.env.FONTE_HTTP_MAPA, null)) };
  } catch (e) {
    console.error('[fontes/http] falha na consulta:', e.message);
    return { ok: false, erro: e.name === 'AbortError' ? 'tempo_esgotado' : e.message };
  } finally { clearTimeout(relogio); }
}

module.exports = { nome, rotulo, oficial, fornece, ativa, motivo, consultar, pega, traduzir, preencher };
