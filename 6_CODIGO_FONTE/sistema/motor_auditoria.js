/**
 * VERIMULTA — Motor de Auditoria (A1–A14) + Jurimetria v1
 * Conforme PRD v2 e Handoff doc 09.
 * Regra de ouro: saída sempre como ESTIMATIVA, nunca garantia.
 */

const DIAS = 24 * 60 * 60 * 1000;
const dif = (a, b) => Math.round((new Date(a) - new Date(b)) / DIAS);

// Prior jurídico de cada tese (força quando o vício está presente)
const PRIORES = {
  A1: 0.55, A2: 0.70, A3: 0.75, A4: 0.80, A5: 0.65, A6: 0.60, A7: 0.55,
  A8: 0.35, A9: 0.50, A10: 0.40, A11: 0.85, A12: 0.30, A13: 0.70, A14: 0.45
};

const BASES = {
  A1: 'CTB art. 280 · Res. CONTRAN 918/2022 (dados obrigatórios do auto)',
  A2: 'CTB arts. 21, 22 e 24 (competência do órgão)',
  A3: 'CTB arts. 281–282 · Res. CONTRAN 918/2022 (prazos de notificação)',
  A4: 'Portaria INMETRO 158/2022 (aferição metrológica)',
  A5: 'Homologação/certificação do equipamento (INMETRO)',
  A6: 'Res. CONTRAN 798/2020 (estudo técnico do local)',
  A7: 'Sinalização obrigatória R-19 / CTB art. 90',
  A8: 'Coordenadas × cadastro do equipamento',
  A9: 'Enquadramento legal compatível com os fatos',
  A10: 'Compatibilidade fática das circunstâncias',
  A11: 'Vedação ao bis in idem (duplicidade)',
  A12: 'Fragilidade probatória (prova/observação do agente)',
  A13: 'Cadeia NA × NP (CTB 281–282 · Res. CONTRAN 900/2022)',
  A14: 'Consistência entre AIT, NA e NP (Res. CONTRAN 900/2022)'
};

/**
 * Executa as 14 verificações sobre uma autuação.
 * @param {object} m multa: {orgao_competente, data_infracao, data_notificacao,
 *   origem ('radar'|'agente'), afericao_validade, homologacao_ok, estudo_tecnico_ok,
 *   sinalizacao_ok, coordenadas_ok, enquadramento_ok, circunstancias_ok,
 *   duplicada, tem_foto, observacao, campos_faltantes[], cadeia_ok, consistencia_ok}
 */
function auditar(m) {
  const V = [];
  const add = (cod, aplicavel, vicio, detalhe) =>
    V.push({ codigo: cod, base_legal: BASES[cod], aplicavel, vicio: aplicavel ? !!vicio : false, detalhe });

  // ---- Formal-documental ----
  const faltantes = m.campos_faltantes || [];
  add('A1', true, faltantes.length > 0,
    faltantes.length ? `Campos ausentes/ilegíveis: ${faltantes.join(', ')}` : 'Dados obrigatórios presentes (CTB 280).');

  add('A2', true, m.orgao_competente === false,
    m.orgao_competente === false ? 'Indício de incompetência do órgão para a via.' : 'Órgão autuador competente para a via.');

  // A3 — prazo de notificação da autuação: 30 dias (postal)
  let prazoVicio = false, prazoDet = 'Datas insuficientes para checagem automática.';
  if (m.data_infracao && m.data_notificacao) {
    const d = dif(m.data_notificacao, m.data_infracao);
    if (Number.isNaN(d)) {
      prazoDet = 'Datas em formato não reconhecido — confira no documento.';
    } else if (d < 0) {
      // Notificação anterior à infração é impossível: ou a data está errada no
      // auto, ou foi lida errada do documento. Antes isto virava "dentro do
      // prazo (-59 dias)" e passava batido.
      prazoVicio = true;
      prazoDet = `Inconsistência de datas: a notificação (${m.data_notificacao}) é ${Math.abs(d)} dias ANTERIOR à infração (${m.data_infracao}). Confira o documento — se confirmado, é vício do auto.`;
    } else {
      prazoVicio = d > 30;
      prazoDet = prazoVicio
        ? `Notificação expedida ${d} dias após a infração (limite: 30).`
        : `Notificação dentro do prazo (${d} dias).`;
    }
  }
  add('A3', true, prazoVicio, prazoDet);

  // ---- Metrológica/Radar (só se origem = radar) ----
  const radar = m.origem === 'radar';
  add('A4', radar, radar && m.afericao_validade === false,
    radar ? (m.afericao_validade === false ? 'Aferição do equipamento fora da validade.' : 'Aferição na validade (verificar certificado).')
          : 'Não se aplica: autuação por agente.');
  add('A5', radar, radar && m.homologacao_ok === false,
    radar ? (m.homologacao_ok === false ? 'Modelo sem homologação localizada.' : 'Homologação verificada.') : 'Não se aplica.');
  add('A6', radar, radar && m.estudo_tecnico_ok === false,
    radar ? (m.estudo_tecnico_ok === false ? 'Estudo técnico do local não localizado (CONTRAN 798/2020).' : 'Estudo técnico presente.') : 'Não se aplica.');
  add('A7', radar, radar && m.sinalizacao_ok === false,
    radar ? (m.sinalizacao_ok === false ? 'Sinalização obrigatória ausente/irregular.' : 'Sinalização adequada.') : 'Não se aplica.');
  add('A8', radar, radar && m.coordenadas_ok === false,
    radar ? (m.coordenadas_ok === false ? 'Coordenadas divergem do cadastro do equipamento.' : 'Coordenadas coerentes.') : 'Não se aplica.');

  // ---- Enquadramento e fatos ----
  add('A9', true, m.enquadramento_ok === false,
    m.enquadramento_ok === false ? 'Enquadramento incompatível com a descrição dos fatos.' : 'Enquadramento compatível.');
  add('A10', true, m.circunstancias_ok === false,
    m.circunstancias_ok === false ? 'Infração incompatível com as circunstâncias apresentadas.' : 'Sem incompatibilidade fática identificada.');
  add('A11', true, m.duplicada === true,
    m.duplicada ? 'Indício de duplicidade de autuação (mesmo fato).' : 'Sem duplicidade localizada.');

  // A12 — fragilidade probatória
  const obs = (m.observacao || '').trim();
  const obsTruncada = obs.length > 0 && obs.length < 25;
  const fragil = (!m.tem_foto && !radar) || obsTruncada;
  add('A12', true, fragil,
    fragil ? `Fragilidade probatória: ${!m.tem_foto ? 'sem registro fotográfico' : ''}${!m.tem_foto && obsTruncada ? ' e ' : ''}${obsTruncada ? 'observação truncada/incompleta' : ''}.`
           : 'Conjunto probatório sem fragilidade evidente.');

  add('A13', true, m.cadeia_ok === false,
    m.cadeia_ok === false ? 'Quebra na cadeia de notificações NA×NP.' : 'Cadeia de notificações regular.');
  add('A14', true, m.consistencia_ok === false,
    m.consistencia_ok === false ? 'Divergência entre AIT, NA e NP.' : 'Documentos consistentes entre si.');

  return V;
}

/**
 * Famílias de teses correlacionadas. Dentro de uma família as teses NÃO são
 * independentes — A4 a A8 tratam todas do mesmo equipamento; A3, A13 e A14
 * tratam todas da mesma cadeia de notificações. Tratá-las como independentes
 * era o que fazia a conta chegar a 100% com um radar de seis vícios.
 */
const FAMILIAS = {
  equipamento:  ['A4', 'A5', 'A6', 'A7', 'A8'],
  notificacao:  ['A3', 'A13', 'A14']
};
/** Peso da 2ª, 3ª... tese dentro da MESMA família (a 1ª entra inteira). */
const DECAIMENTO = 0.30;
/** Teto da estimativa. Nenhum resultado é certo: 100% seria promessa. */
const TETO = 0.85;

function familiaDe(codigo) {
  for (const [nome, membros] of Object.entries(FAMILIAS))
    if (membros.includes(codigo)) return nome;
  return `isolada:${codigo}`;      // cada tese sem família é o seu próprio grupo
}

/**
 * Jurimetria v2: P(êxito) = 1 − ∏(1 − p_grupo), onde cada grupo de teses
 * correlacionadas contribui uma vez, com as teses seguintes descontadas.
 * Resultado sempre como ESTIMATIVA e limitado ao teto.
 */
function jurimetria(verificacoes) {
  const teses = verificacoes.filter(v => v.aplicavel && v.vicio)
    .map(v => ({ codigo: v.codigo, base_legal: v.base_legal, p: PRIORES[v.codigo], detalhe: v.detalhe }));

  // Agrupa e combina dentro da família (a mais forte inteira, as demais descontadas).
  const grupos = new Map();
  for (const t of teses) {
    const g = familiaDe(t.codigo);
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(t.p);
  }
  let correlacionadas = false;
  const pGrupos = [...grupos.values()].map(ps => {
    if (ps.length > 1) correlacionadas = true;
    const ordenadas = [...ps].sort((a, b) => b - a);
    // 1 − ∏(1 − p_k · decaimento^k) com k começando em 0
    return 1 - ordenadas.reduce((acc, p, k) => acc * (1 - p * Math.pow(DECAIMENTO, k)), 1);
  });

  const bruta = 1 - pGrupos.reduce((acc, p) => acc * (1 - p), 1);
  const prob = Math.min(bruta, TETO);
  const pct = Math.round(prob * 100);
  const faixa = pct >= 70 ? 'alta' : pct >= 40 ? 'média' : pct > 0 ? 'baixa' : 'muito baixa';

  // Manchete do resultado (Plano 7 Dias v2): o número é apoio, o índice é o título.
  const indice = teses.length === 0 ? 'SEM INCONSISTÊNCIA'
               : teses.length === 1 ? 'REQUER ATENÇÃO'
               : 'POSSÍVEL INCONSISTÊNCIA';

  return {
    indice,
    probabilidade: pct,
    faixa,
    teses,
    teto_aplicado: bruta > TETO,
    disclaimer: 'Estimativa calculada a partir das verificações — nunca garantia. A decisão é do órgão julgador.',
    nota_correlacao: correlacionadas
      ? 'Teses do mesmo equipamento ou da mesma cadeia de notificações são tratadas como correlacionadas: contam uma vez, com as demais descontadas.'
      : ''
  };
}

module.exports = { auditar, jurimetria, PRIORES, BASES, FAMILIAS, TETO };
