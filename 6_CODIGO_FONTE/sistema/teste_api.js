/**
 * VERIMULTA — bateria de integração das rotas HTTP.
 * Sobe o servidor num banco descartável e exercita o funil inteiro, incluindo
 * as regressões que já custaram caro: webhook no endereço errado, ativação de
 * plano de graça, IDOR de veículo e consentimento LGPD não gravado.
 *
 *   node teste_api.js
 */
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORTA = 3131;
const BASE = `http://127.0.0.1:${PORTA}`;
const BANCO = path.join(os.tmpdir(), `verimulta-teste-${Date.now()}.db`);
const SEGREDOS = {
  JWT_SECRET: 'teste-jwt-segredo-longo-para-a-bateria-0001',
  ADMIN_SECRET: 'teste-admin-segredo',
  WEBHOOK_SECRET: 'teste-webhook-segredo'
};

let falhas = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FALHA ') + m); if (!c) falhas++; };

function subir(env) {
  const filho = spawn(process.execPath, ['servidor.js'], {
    cwd: __dirname,
    env: { ...process.env, ...SEGREDOS, ...env, PORT: String(PORTA), DB_PATH: BANCO },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  filho.stderr.on('data', d => {
    const t = String(d);
    if (!/ExperimentalWarning/.test(t)) process.stderr.write('    [servidor] ' + t);
  });
  return filho;
}

async function esperarNoAr(tentativas = 60) {
  for (let i = 0; i < tentativas; i++) {
    try { const r = await fetch(`${BASE}/v1/saude`); if (r.ok) return true; } catch (e) { /* ainda subindo */ }
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

async function chamar(metodo, caminho, opcoes = {}) {
  const { token, json, admin, cru } = opcoes;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (admin) headers['X-Admin-Secret'] = admin;
  if (json) headers['Content-Type'] = 'application/json';
  const r = await fetch(BASE + caminho, {
    method: metodo, headers, body: json ? JSON.stringify(json) : undefined
  });
  if (cru) return { status: r.status, buffer: Buffer.from(await r.arrayBuffer()) };
  const dados = await r.json().catch(() => ({}));
  return { status: r.status, dados };
}

(async () => {
  let servidor = subir({ NODE_ENV: 'teste', GATEWAY: 'demo' });
  if (!await esperarNoAr()) { console.error('servidor não subiu'); process.exit(1); }

  console.log('\n[1] Cadastro e consentimento LGPD');
  const email = `teste${Date.now()}@verimulta.test`;
  let r = await chamar('POST', '/v1/auth/register', { json: { nome: 'Rodrigo Teste', email, senha: 'Senha!2026' } });
  ok(r.status === 400 && r.dados.campo === 'consentimento', 'cadastro SEM aceite é recusado (LGPD art. 8º)');

  r = await chamar('POST', '/v1/auth/register', {
    json: { nome: 'Rodrigo Teste', cpf: '12345678901', email, senha: 'Senha!2026', consentimento: true }
  });
  ok(r.status === 201 && !!r.dados.token, 'cadastro COM aceite cria a conta');
  ok(!!r.dados.consentimento_lgpd && r.dados.consentimento_lgpd.registrado === true,
     'resposta confirma consentimento registrado');
  const token = r.dados.token;

  r = await chamar('GET', '/v1/eu/dados', { token });
  ok(r.dados.titular && r.dados.titular.consentimento_lgpd === 1,
     'consentimento GRAVADO no banco (antes só existia na resposta)');
  ok(!!r.dados.titular.consentimento_em && !!r.dados.titular.consentimento_versao,
     'data e versão do termo gravadas junto');

  console.log('\n[2] Veículos e IDOR no scan');
  r = await chamar('POST', '/v1/veiculos', { token, json: { placa: 'ABC1D23' } });
  const meuVeiculo = r.dados.id;
  ok(r.status === 201, `veículo criado (id ${meuVeiculo})`);

  const outro = await chamar('POST', '/v1/auth/register', {
    json: { nome: 'Outra Pessoa', email: `outro${Date.now()}@v.test`, senha: 'Senha!2026', consentimento: true }
  });
  const alheio = await chamar('POST', '/v1/veiculos', { token: outro.dados.token, json: { placa: 'XYZ9K88' } });
  r = await chamar('POST', '/v1/multas/scan', {
    token, json: { veiculo_id: alheio.dados.id, texto: 'AUTO DE INFRACAO T00000001' }
  });
  ok(r.status === 404, 'scan NÃO aceita veículo de terceiro (IDOR fechado)');

  console.log('\n[3] Funil: scan → diagnóstico → paywall');
  const doc = [
    'AUTO DE INFRACAO T00226588',
    'PLACA ABC1D23',
    'DATA   HORA',
    '10/06/2026 14:30',
    'DATA DA NOTIFICACAO 20/06/2026',
    'Valor R$ 130,16'
  ].join('\n');
  r = await chamar('POST', '/v1/multas/scan', { token, json: { veiculo_id: meuVeiculo, texto: doc } });
  ok(r.status === 201, 'multa registrada a partir do texto do documento');
  const multaId = r.dados.multa_id;

  r = await chamar('GET', `/v1/multas/${multaId}/diagnostico`, { token });
  ok(r.status === 200 && Array.isArray(r.dados.verificacoes) && r.dados.verificacoes.length === 14,
     '14 verificações retornadas');
  ok(r.dados.probabilidade === null && r.dados.faixa === 'bloqueada',
     'paywall trava a probabilidade no plano grátis');
  ok(typeof r.dados.indice === 'string' && r.dados.indice.length > 0,
     `Índice de Consistência na manchete: ${r.dados.indice}`);

  r = await chamar('POST', '/v1/recursos', { token, json: { multa_id: multaId } });
  ok(r.status === 402, 'defesa bloqueada para não assinante (paywall no servidor, não só na tela)');

  console.log('\n[4] Checkout com a grade oficial');
  for (const par of [['combo1', 29.9], ['combo2', 39.9], ['combo3', 49.9]]) {
    r = await chamar('POST', '/v1/checkout', { token, json: { plano: par[0] } });
    ok(r.status === 200 && r.dados.valor === par[1], `${par[0]} aceito pelo checkout a R$ ${par[1]}`);
  }
  r = await chamar('POST', '/v1/checkout', { token, json: { plano: 'nao_existe' } });
  ok(r.status === 400, 'plano inexistente recusado pelo checkout');

  console.log('\n[5] Webhook — os DOIS endereços respondem');
  const corpo = { usuario_id: 1, plano: 'combo1', status: 'authorized' };
  const assinatura = crypto.createHmac('sha256', SEGREDOS.WEBHOOK_SECRET)
    .update(JSON.stringify(corpo)).digest('hex');
  for (const rota of ['/v1/webhooks/pagamento', '/v1/webhooks/mercadopago']) {
    const resp = await fetch(BASE + rota, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-signature': assinatura },
      body: JSON.stringify(corpo)
    });
    const d = await resp.json().catch(() => ({}));
    ok(resp.status === 200 && d.ativado === 'combo1',
       `${rota} ativa o plano (o endereço do manual respondia 404)`);
  }
  const semAssinatura = await fetch(BASE + '/v1/webhooks/mercadopago', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo)
  });
  ok(semAssinatura.status === 401, 'webhook sem assinatura válida é recusado');

  console.log('\n[6] Assinante: defesa e PDF timbrado do servidor');
  r = await chamar('POST', '/v1/recursos', { token, json: { multa_id: multaId } });
  ok(r.status === 201 && /DEFESA PR/.test(r.dados.texto || ''), 'defesa gerada para assinante');
  const recursoId = r.dados.recurso_id;

  let pdf = await chamar('GET', `/v1/recursos/${recursoId}/pdf`, { token, cru: true });
  ok(pdf.status === 200 && pdf.buffer.slice(0, 5).toString() === '%PDF-',
     `Defesa Prévia em PDF pelo servidor (${pdf.buffer.length} bytes)`);
  pdf = await chamar('GET', `/v1/multas/${multaId}/extrato.pdf`, { token, cru: true });
  ok(pdf.status === 200 && pdf.buffer.slice(0, 5).toString() === '%PDF-',
     `Extrato de Auditoria em PDF (${pdf.buffer.length} bytes)`);

  console.log('\n[7] Painel do Dono');
  r = await chamar('GET', '/v1/admin/resumo', {});
  ok(r.status === 401, 'painel recusa quem não tem a chave');
  r = await chamar('GET', '/v1/admin/resumo', { admin: SEGREDOS.ADMIN_SECRET });
  ok(r.status === 200 && r.dados.mrr === 29.9, `MRR calculado pela fonte única: R$ ${r.dados.mrr}`);

  console.log('\n[8] Rate limit no login');
  let bloqueou = false;
  for (let i = 0; i < 14; i++) {
    const t = await chamar('POST', '/v1/auth/login', { json: { email: 'ninguem@v.test', senha: 'errada' } });
    if (t.status === 429) { bloqueou = true; break; }
  }
  ok(bloqueou, 'força bruta no login é barrada com 429');

  console.log('\n[9] Direito de eliminação (LGPD art. 18, VI)');
  r = await chamar('DELETE', '/v1/eu/conta', { token });
  ok(r.status === 409, 'exige cancelar a assinatura antes de excluir');
  await chamar('POST', '/v1/assinaturas/cancelar', { token });
  r = await chamar('DELETE', '/v1/eu/conta', { token });
  ok(r.status === 200, 'conta excluída após o cancelamento');
  r = await chamar('GET', '/v1/eu/dados', { token });
  ok(r.dados.titular.nome === '(titular excluído)' && r.dados.multas.length === 0,
     'dados pessoais anonimizados e multas removidas');

  console.log('\n[10] Produção: ativação direta tem de estar FECHADA');
  servidor.kill();
  await new Promise(r => setTimeout(r, 800));
  servidor = subir({ NODE_ENV: 'production', GATEWAY: 'demo' });   // exatamente o padrão do render.yaml
  if (!await esperarNoAr()) { console.error('servidor de produção não subiu'); process.exit(1); }
  const novo = await chamar('POST', '/v1/auth/register', {
    json: { nome: 'Prod', email: `prod${Date.now()}@v.test`, senha: 'Senha!2026', consentimento: true }
  });
  r = await chamar('POST', '/v1/assinaturas/ativar', {
    token: novo.dados.token, json: { plano: 'empresa_pro' }
  });
  ok(r.status === 403, 'NODE_ENV=production bloqueia /v1/assinaturas/ativar mesmo com GATEWAY=demo');

  servidor.kill();
  await new Promise(r => setTimeout(r, 500));
  for (const sufixo of ['', '-wal', '-shm']) { try { fs.unlinkSync(BANCO + sufixo); } catch (e) { /* ok */ } }
  console.log(`\n=== ${falhas} falha(s) ===`);
  process.exit(falhas ? 1 : 0);
})();
