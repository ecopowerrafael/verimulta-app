/**
 * VERIMULTA — datas no fuso de quem usa o app.
 *
 * O servidor roda em UTC (Render), o motorista vive em UTC-3. Contar prazo com
 * `new Date().toISOString()` funcionava durante o dia e quebrava à noite: das
 * 21h em diante o "hoje" do servidor já é o dia seguinte no Brasil, e o alerta
 * de 7 dias passava a procurar multas que vencem em 8 — ninguém era avisado.
 *
 * Prazo de defesa é DIA DE CALENDÁRIO, não instante. Tudo aqui trabalha com a
 * data civil do fuso de referência.
 */
const FUSO = process.env.FUSO_HORARIO || 'America/Sao_Paulo';

// 'en-CA' formata como AAAA-MM-DD, que é o formato usado no banco.
const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'
});

/** Data civil (AAAA-MM-DD) no fuso de referência. `mais` desloca em dias. */
function dataLocal(mais = 0, base = Date.now()) {
  return formatador.format(new Date(base + mais * 86400000));
}

/** Hoje no fuso de referência (AAAA-MM-DD). */
function hoje() { return dataLocal(0); }

/**
 * Dias de calendário entre hoje e uma data AAAA-MM-DD.
 * Positivo = ainda falta; 0 = vence hoje; negativo = já passou.
 * Compara datas civis, então não sofre com hora nem com fuso.
 */
function diasAte(dataISO) {
  if (!dataISO) return null;
  const emUTC = (iso) => {
    const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    if (!a || !m || !d) return null;
    return Date.UTC(a, m - 1, d);
  };
  const alvo = emUTC(dataISO);
  const agora = emUTC(hoje());
  if (alvo === null || agora === null) return null;
  return Math.round((alvo - agora) / 86400000);
}

/** AAAA-MM-DD » DD/MM/AAAA, para mostrar ao usuário. */
function paraBR(dataISO) {
  if (!dataISO) return '';
  return String(dataISO).slice(0, 10).split('-').reverse().join('/');
}

/**
 * Carimbo do banco (UTC, como o SQLite grava) » hora local legível.
 * O banco continua em UTC, que é o certo; a conversão é só na exibição.
 */
function carimboLocal(valorUTC) {
  if (!valorUTC) return '';
  const iso = String(valorUTC).replace(' ', 'T') + (String(valorUTC).endsWith('Z') ? '' : 'Z');
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(valorUTC);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d);
}

module.exports = { FUSO, dataLocal, hoje, diasAte, paraBR, carimboLocal };
