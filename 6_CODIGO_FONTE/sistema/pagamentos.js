/**
 * VERIMULTA — Pagamentos (checkout + webhook)
 * GATEWAY=demo        → ativação direta para testes (padrão)
 * GATEWAY=mercadopago → assinatura recorrente real via API do Mercado Pago
 *
 * Env de produção:
 *   GATEWAY=mercadopago
 *   MP_ACCESS_TOKEN=APP_USR-xxxxxxxx        (mercadopago.com/developers → sua app → credenciais de produção)
 *   WEBHOOK_SECRET=assinatura-secreta-do-webhook  (painel MP → Webhooks → assinatura secreta)
 *   URL_BASE=https://verimulta.onrender.com
 */
const crypto = require('crypto');
const { db } = require('./banco');
let emails; try { emails = require('./emails'); } catch(e) { emails = { enviar: async()=>{} }; }

db.exec(`CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  plano TEXT, valor REAL, gateway TEXT, referencia_externa TEXT,
  evento TEXT, status TEXT, payload_json TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);`);

const GATEWAY = process.env.GATEWAY || 'demo';
const MP_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const SEGREDO_WEBHOOK = require('./config').WEBHOOK_SECRET;
const URL_BASE = process.env.URL_BASE || 'http://localhost:3000';

// Preços e nomes derivam de planos.js — as chaves são as MESMAS aceitas pelo servidor.
const { PRECOS, NOMES } = require('./planos');

function registrar(usuario_id, plano, valor, evento, status, payload, referencia) {
  db.prepare(`INSERT INTO pagamentos (usuario_id,plano,valor,gateway,referencia_externa,evento,status,payload_json)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(usuario_id, plano, valor, GATEWAY, referencia || null, evento, status, JSON.stringify(payload || {}));
}
function ativarPlano(usuario_id, plano) {
  db.prepare('UPDATE usuarios SET plano=? WHERE id=?').run(plano, usuario_id);
}

/** Cria o checkout de assinatura. */
async function criarCheckout(usuario, plano) {
  if (!PRECOS[plano]) throw Object.assign(new Error('Plano inválido para checkout.'), { http: 400 });

  if (GATEWAY === 'demo') {
    registrar(usuario.id, plano, PRECOS[plano], 'checkout_demo', 'pendente', {}, null);
    return { modo: 'demo', plano, valor: PRECOS[plano],
      aviso: 'GATEWAY=demo — ativação direta liberada para testes. Em produção, configure GATEWAY=mercadopago.' };
  }

  // ---- Mercado Pago: assinatura recorrente (preapproval) ----
  const corpo = {
    reason: NOMES[plano],
    external_reference: `${usuario.id}|${plano}`,
    payer_email: usuario.email,
    back_url: `${URL_BASE}/app.html`,
    auto_recurring: {
      frequency: 1, frequency_type: 'months',
      transaction_amount: PRECOS[plano], currency_id: 'BRL'
    }
  };
  const r = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  const dados = await r.json();
  if (!r.ok) throw Object.assign(new Error('Gateway recusou o checkout.'), { http: 502, detalhe: dados });
  registrar(usuario.id, plano, PRECOS[plano], 'checkout_criado', 'pendente', dados, dados.id);
  return { modo: 'mercadopago', checkout_url: dados.init_point, referencia: dados.id };
}

/** Valida a assinatura do webhook (formato x-signature do Mercado Pago: "ts=...,v1=...") */
function validarAssinaturaMP(req) {
  const sig = req.headers['x-signature'] || '';
  const reqId = req.headers['x-request-id'] || '';
  const partes = Object.fromEntries(sig.split(',').map(p => p.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  const idRecurso = (req.query['data.id'] || (req.body && req.body.data && req.body.data.id) || '').toString();
  const manifesto = `id:${idRecurso};request-id:${reqId};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', SEGREDO_WEBHOOK).update(manifesto).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1)); }
  catch { return false; }
}

/** Valida webhook do modo demo/teste: HMAC do corpo bruto no header x-demo-signature. */
function validarAssinaturaDemo(req) {
  const recebida = req.headers['x-demo-signature'] || '';
  const esperado = crypto.createHmac('sha256', SEGREDO_WEBHOOK)
    .update(JSON.stringify(req.body || {})).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(recebida)); }
  catch { return false; }
}

/** Processa o evento do webhook e ativa/cancela o plano. */
async function processarWebhook(req) {
  if (GATEWAY === 'demo') {
    if (!validarAssinaturaDemo(req)) return { http: 401, resposta: { erro: 'Assinatura do webhook inválida.' } };
    const { usuario_id, plano, status } = req.body || {};
    if (!usuario_id || !PRECOS[plano]) return { http: 400, resposta: { erro: 'Payload incompleto.' } };
    if (status === 'authorized') {
      ativarPlano(usuario_id, plano);
      registrar(usuario_id, plano, PRECOS[plano], 'webhook_demo', 'authorized', req.body, null);
      const u = db.prepare('SELECT id,nome,email FROM usuarios WHERE id=?').get(usuario_id);
      if (u) emails.enviar('pagamento_confirmado', u, { plano: NOMES[plano] }).catch(()=>{});
      return { http: 200, resposta: { ok: true, ativado: plano } };
    }
    if (status === 'cancelled') {
      ativarPlano(usuario_id, 'gratis');
      registrar(usuario_id, plano, 0, 'webhook_demo', 'cancelled', req.body, null);
      return { http: 200, resposta: { ok: true, cancelado: true } };
    }
    return { http: 200, resposta: { ok: true, ignorado: status } };
  }

  // ---- Mercado Pago real ----
  if (!validarAssinaturaMP(req)) return { http: 401, resposta: { erro: 'Assinatura do webhook inválida.' } };
  const tipo = (req.body && req.body.type) || req.query.type;
  const idRecurso = (req.query['data.id'] || (req.body && req.body.data && req.body.data.id) || '').toString();
  if (!idRecurso) return { http: 200, resposta: { ok: true, ignorado: 'sem id' } };

  // Nunca confiar no payload: buscar o estado real no gateway
  const rotas = { preapproval: `https://api.mercadopago.com/preapproval/${idRecurso}`,
                  payment: `https://api.mercadopago.com/v1/payments/${idRecurso}` };
  const url = tipo === 'payment' ? rotas.payment : rotas.preapproval;
  const r = await fetch(url, { headers: { 'Authorization': `Bearer ${MP_TOKEN}` } });
  const recurso = await r.json();
  if (!r.ok) return { http: 200, resposta: { ok: true, ignorado: 'recurso não encontrado' } };

  const ref = (recurso.external_reference || '').split('|');
  const usuario_id = parseInt(ref[0], 10); const plano = ref[1];
  if (!usuario_id || !PRECOS[plano]) return { http: 200, resposta: { ok: true, ignorado: 'referência desconhecida' } };

  const status = recurso.status;
  if (['authorized', 'approved'].includes(status)) {
    ativarPlano(usuario_id, plano);
    registrar(usuario_id, plano, PRECOS[plano], `webhook_${tipo}`, status, recurso, idRecurso);
    const u = db.prepare('SELECT id,nome,email FROM usuarios WHERE id=?').get(usuario_id);
    if (u) emails.enviar('pagamento_confirmado', u, { plano: NOMES[plano] }).catch(()=>{});
  } else if (['cancelled', 'paused'].includes(status)) {
    ativarPlano(usuario_id, 'gratis');
    registrar(usuario_id, plano, 0, `webhook_${tipo}`, status, recurso, idRecurso);
  } else {
    registrar(usuario_id, plano, null, `webhook_${tipo}`, status, recurso, idRecurso);
  }
  return { http: 200, resposta: { ok: true, status } };
}

module.exports = { criarCheckout, processarWebhook, GATEWAY, PRECOS };
