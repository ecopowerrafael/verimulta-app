/**
 * VERIMULTA — OCR e Extrator de Campos
 * 1) ocrImagem(): envia a foto ao Google Vision (se GOOGLE_VISION_KEY configurada)
 * 2) extrairCampos(): transforma o TEXTO do documento nos campos estruturados da multa
 *    (testado contra Notificação de Autuação real do padrão SNE/órgãos municipais)
 */

const RX = {
  ait: /(?:AIT|AUTO DE INFRA[ÇC][AÃ]O)[^A-Z0-9]{0,40}?([A-Z]{1,3}\s?\d{6,10})/i,
  ait_solto: /\b([A-Z]\d{8})\b/,
  placa: /\b([A-Z]{3}\d[A-Z0-9]\d{2})\b/,
  codigo_infracao: /C[ÓO]DIGO DA INFRA[ÇC][AÃ]O\s+DESDOBRAMENTO[\s\S]{0,250}?(\d{4})\s+(\d{1,2})\b/i,
  enq_compacto: /\b(\d{4})[-\s](\d)\b(?=[\s\S]{0,60}R\$)/,
  valor: /R\$\s?([\d.,]+)/,
  datas: /\b(\d{2}\/\d{2}\/\d{4})\b/g,
  data_notificacao: /DATA DA NOTIFICA[ÇC][AÃ]O[\s\S]{0,200}?(\d{2}\/\d{2}\/\d{4})/i,
  prazo_defesa: /DEFESA PR[ÉE]VIA[\s\S]{0,60}?(\d{2}\/\d{2}\/\d{4})/i,
  prazo_condutor: /IDENTIFICA[ÇC][AÃ]O DO CONDUTOR INFRATOR[\s\S]{0,200}?(\d{2}\/\d{2}\/\d{4})/i,
  data_hora_infracao: /DATA\s+HORA[\s\S]{0,300}?(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/i,
  linha_orgao_local: /\n\s*(\d{5,7})\s{2,}([A-ZÀ-Ú][A-ZÀ-Ú .\/-]{3,40}?)\s{2,}([A-ZÀ-Ú][^\n]{8,90}?)\s*\n/,
  descricao: /DESCRI[ÇC][AÃ]O DA INFRA[ÇC][AÃ]O\s*\n+([^\n]{10,160})/i,
  equipamento: /N[ÚU]MERO DO EQUIPAMENTO[\s\S]{0,80}?\n\s*([^\n]+)/i,
  matricula_agente: /MATR[ÍI]CULA[^\d]{0,20}(\d{4,8})/i,
  observacao: /OBSERVA[ÇC][AÃ]O[ :]*\n?\s*([^\n]{3,200})/i,
  
};

function brData(d) { // dd/mm/aaaa → aaaa-mm-dd
  if (!d) return null;
  const [dd, mm, aa] = d.split('/');
  return `${aa}-${mm}-${dd}`;
}
function brValor(v) {
  if (!v) return null;
  return parseFloat(v.replace(/\./g, '').replace(',', '.'));
}

/** Pontuação por infração (CTB): gravíssima 7, grave 5, média 4, leve 3. Mapa mínimo por prefixo. */
/**
 * Pontuação por código de enquadramento (CTB art. 259, com a redação da Lei
 * 14.071/2020): gravíssima 7 · grave 5 · média 4 · leve 3.
 * Cobre os enquadramentos mais frequentes em autuação urbana e de radar.
 * Código não listado devolve null — o app pede confirmação manual em vez de
 * chutar, que é o comportamento correto para um número que vai na defesa.
 */
const PONTOS_CTB = {
  // --- Velocidade (art. 218) ---
  '7455': 4,   // até 20% acima do limite — média
  '7463': 5,   // mais de 20% até 50% — grave
  '7471': 7,   // mais de 50% acima do limite — gravíssima
  // --- Avanço de sinal e parada (art. 208, 182, 181) ---
  '6050': 7,   // avançar o sinal vermelho — gravíssima
  '5185': 4,   // estacionar em desacordo com a regulamentação — média
  '5541': 5,   // parar sobre a faixa de pedestres — grave
  // --- Condutor e documentos (art. 162, 232, 230) ---
  '5010': 7,   // dirigir sem habilitação — gravíssima
  '6017': 5,   // conduzir sem portar documento de porte obrigatório — leve/grave conforme caso
  '6521': 7,   // conduzir veículo com licenciamento vencido — gravíssima
  // --- Segurança (art. 244, 252, 167) ---
  '7366': 4,   // dirigir manuseando telefone celular — média (Lei 14.071/2020)
  '5738': 5,   // dirigir com o braço fora do veículo — grave
  '5169': 5,   // deixar de usar o cinto de segurança — grave
  // --- Faixas e circulação (art. 184, 185, 186) ---
  '5479': 4,   // transitar pela contramão em via de mão dupla — média
  '6068': 7,   // transitar em faixa exclusiva — gravíssima
  // --- Tolerância / preferência (art. 214) ---
  '5231': 7    // deixar de dar preferência a pedestre — gravíssima
};

function pontosPorEnquadramento(cod) {
  return PONTOS_CTB[cod] ?? null;
}

/** Extrai os campos estruturados a partir do texto OCR/PDF da notificação. */
function extrairCampos(texto) {
  const t = texto.replace(/\r/g, '');
  const m = {};
  const pega = (rx, i = 1) => { const x = t.match(rx); return x ? (x[i] || '').trim() : null; };

  m.ait = (pega(RX.ait) || pega(RX.ait_solto) || '').replace(/\s/g, '') || null;
  m.placa = pega(RX.placa);
  const enq = t.match(RX.codigo_infracao) || t.match(RX.enq_compacto);
  m.enquadramento = enq ? `${enq[1]}-${enq[2]}` : null;
  m.valor = brValor(pega(RX.valor));
  m.data_notificacao = brData(pega(RX.data_notificacao));
  m.prazo_defesa = brData(pega(RX.prazo_defesa));
  m.prazo_indicacao_condutor = brData(pega(RX.prazo_condutor));
  const dh = t.match(RX.data_hora_infracao);
  m.data_infracao = dh ? brData(dh[1]) : null;
  m.hora_infracao = dh ? dh[2] : null;
  const ol = t.match(RX.linha_orgao_local);
  m.orgao = ol ? ol[2].trim() : null;
  m.local = ol ? ol[3].trim() : null;
  const colunaDireita = s => s ? s.split(/\s{4,}/).pop().trim() : null;   // layout 2 colunas: fica com a direita
  m.descricao = colunaDireita(pega(RX.descricao));
  m.observacao = colunaDireita(pega(RX.observacao));

  // origem: radar × agente (heurística objetiva)
  const equipIndisponivel = /EQUIPAMENTO[\s\S]{0,250}?N[aã]o dispon/i.test(t);
  const medicaoIndisponivel = /MEDI[ÇC][AÃ]O REALIZADA[\s\S]{0,250}?N[aã]o dispon/i.test(t);
  m.origem = (equipIndisponivel || medicaoIndisponivel) ? 'agente' : 'radar';
  m.matricula_agente = pega(RX.matricula_agente);

  // sinais para a auditoria
  const temSecaoFoto = /REGISTRO FOTOGR[ÁA]FICO|IMAGEM DA INFRA[ÇC][AÃ]O/i.test(t);
  m.tem_foto = temSecaoFoto && !/(?:REGISTRO FOTOGR[ÁA]FICO|IMAGEM DA INFRA[ÇC][AÃ]O)[\s\S]{0,150}?N[aã]o dispon/i.test(t);
  if (m.enquadramento) m.pontos = pontosPorEnquadramento(m.enquadramento.split('-')[0]);

  // campos obrigatórios ausentes (alimenta a verificação A1)
  const obrigatorios = { ait: m.ait, placa: m.placa, enquadramento: m.enquadramento, data_infracao: m.data_infracao, orgao: m.orgao, local: m.local };
  m.campos_faltantes = Object.entries(obrigatorios).filter(([, v]) => !v).map(([k]) => k);

  m.confianca = Math.round(100 * (6 - m.campos_faltantes.length) / 6);
  return m;
}

/** OCR da imagem via Google Vision (REST). Sem chave → null (fluxo segue com confirmação manual). */
async function ocrImagem(caminhoArquivo) {
  const CHAVE = process.env.GOOGLE_VISION_KEY;
  if (!CHAVE) return null;
  const fs = require('fs');
  const conteudo = fs.readFileSync(caminhoArquivo).toString('base64');
  const r = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${CHAVE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ image: { content: conteudo }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] })
  });
  const dados = await r.json();
  return dados?.responses?.[0]?.fullTextAnnotation?.text || null;
}

module.exports = { extrairCampos, ocrImagem };
