/**
 * VERIMULTA — Segredos da aplicação.
 * Em produção (NODE_ENV=production) as três variáveis são OBRIGATÓRIAS: sem elas
 * o processo aborta. Em desenvolvimento gera um valor aleatório por execução e
 * avisa no console — nunca existe um segredo padrão previsível no código.
 */
const crypto = require('crypto');
const PRODUCAO = process.env.NODE_ENV === 'production';
const faltando = [];

function segredo(nome) {
  const v = process.env[nome];
  if (v) return v;
  if (PRODUCAO) { faltando.push(nome); return null; }
  const gerado = crypto.randomBytes(24).toString('hex');
  console.warn(`[dev] ${nome} não definida — valor aleatório desta execução: ${gerado}`);
  return gerado;
}

const JWT_SECRET     = segredo('JWT_SECRET');
const ADMIN_SECRET   = segredo('ADMIN_SECRET');
const WEBHOOK_SECRET = segredo('WEBHOOK_SECRET');

if (faltando.length) {
  console.error(`ERRO DE CONFIGURAÇÃO: defina ${faltando.join(', ')} no ambiente antes de subir em produção.`);
  process.exit(1);
}
if (PRODUCAO && (process.env.GATEWAY || 'demo') === 'demo') {
  console.warn('[atenção] GATEWAY=demo em produção: o checkout NÃO cobra de verdade — nenhuma assinatura será faturada. Defina GATEWAY=mercadopago e MP_ACCESS_TOKEN para vender. (A ativação direta já está bloqueada por NODE_ENV=production.)');
}

/** Comparação de segredo resistente a timing attack. */
function conferirSegredo(recebido, esperado) {
  const a = Buffer.from(String(recebido || ''));
  const b = Buffer.from(String(esperado || ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { JWT_SECRET, ADMIN_SECRET, WEBHOOK_SECRET, PRODUCAO, conferirSegredo };
