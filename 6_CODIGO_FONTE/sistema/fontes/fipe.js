/**
 * VERIMULTA — fonte FIPE (via BrasilAPI).
 *
 * Esta é a única fonte externa que liga HOJE, sem contrato e sem chave: a
 * tabela FIPE é pública e a BrasilAPI a serve aberta. Não diz nada sobre o
 * veículo de ninguém — diz o valor de mercado de um modelo — então não
 * esbarra em LGPD nem no credenciamento do SENATRAN.
 *
 * Serve para: o usuário identificar o próprio veículo (marca/modelo/ano) e o
 * app mostrar o valor de referência, que entra na conversa sobre pagar ou
 * recorrer.
 *
 * A fonte pode estar fora do ar — já esteve durante o desenvolvimento. Quando
 * isso acontece, devolve ok:false e a tela diz que não conseguiu consultar.
 * Nunca inventa um valor.
 */
const BASE = process.env.FIPE_BASE || 'https://brasilapi.com.br/api/fipe';
const TEMPO_LIMITE = Number(process.env.FIPE_TIMEOUT_MS || 8000);

const nome = 'fipe';
const rotulo = 'Tabela FIPE (pública, via BrasilAPI)';
const oficial = false;         // é dado público de referência, não base do órgão
const fornece = ['valor_fipe'];

/** Pública e sem chave: desligada só se alguém apagar a URL base. */
function ativa() { return String(process.env.FIPE_DESLIGADA || '') !== 'true' && !!BASE; }
function motivo() { return 'Desligada por configuração (FIPE_DESLIGADA=true).'; }

async function buscar(caminho) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE);
  try {
    const r = await fetch(`${BASE}${caminho}`, { signal: controle.signal });
    if (!r.ok) return null;
    return await r.json();
  } finally { clearTimeout(relogio); }
}

/** Marcas de carro, moto ou caminhão. */
async function marcas(tipo = 'carros') {
  const dados = await buscar(`/marcas/v1/${encodeURIComponent(tipo)}`);
  return Array.isArray(dados) ? dados : null;
}

/** Modelos de uma marca. */
async function modelos(tipo, codigoMarca) {
  const dados = await buscar(`/veiculos/v1/${encodeURIComponent(tipo)}/${encodeURIComponent(codigoMarca)}`);
  return Array.isArray(dados) ? dados : null;
}

/**
 * Consulta padrão da camada de fontes.
 * @param {object} p {codigo_fipe} ou {tipo, marca} ou {tipo}
 */
async function consultar(p = {}) {
  try {
    if (p.codigo_fipe) {
      const dados = await buscar(`/preco/v1/${encodeURIComponent(p.codigo_fipe)}`);
      if (!Array.isArray(dados) || !dados.length) return { ok: false };
      return { ok: true, dados: { precos: dados } };
    }
    if (p.marca) {
      const lista = await modelos(p.tipo || 'carros', p.marca);
      return lista ? { ok: true, dados: { modelos: lista } } : { ok: false };
    }
    const lista = await marcas(p.tipo || 'carros');
    return lista ? { ok: true, dados: { marcas: lista } } : { ok: false };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

module.exports = { nome, rotulo, oficial, fornece, ativa, motivo, consultar, marcas, modelos };
