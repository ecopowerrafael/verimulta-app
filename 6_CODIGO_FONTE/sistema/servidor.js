/** VERIMULTA — API v1 (MVP) · Node/Express · JWT · SQLite */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { db, gerarDefesa } = require('./banco');
const { auditar, jurimetria } = require('./motor_auditoria');
const pagamentos = require('./pagamentos');
const { extrairCampos, ocrImagem } = require('./ocr');
const emails = require('./emails');
const monitor = require('./monitor');
const { PLANOS, planoDe } = require('./planos');
const { JWT_SECRET, ADMIN_SECRET, conferirSegredo } = require('./config');

const SEGREDO = JWT_SECRET;
const PORTA = process.env.PORT || 3000;
const app = express();
app.use((req, res, next) => {           // CORS (app pode viver no Netlify e API no Render)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(__dirname + '/publico'));   // site + app servidos junto da API
app.use(express.json({ limit: '2mb' }));
const upload = multer({ dest: '/tmp/uploads', limits: { fileSize: 8 * 1024 * 1024 } });

// A tabela de planos vive em planos.js — servidor e checkout leem a MESMA fonte.

// ---------- middleware ----------
function autenticar(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Token ausente.' });
  try { req.usuario = jwt.verify(token, SEGREDO); next(); }
  catch { return res.status(401).json({ erro: 'Token inválido ou expirado.' }); }
}
function exigeAssinatura(req, res, next) {
  const u = db.prepare('SELECT plano FROM usuarios WHERE id=?').get(req.usuario.id);
  if (!u || !PLANOS[u.plano] || !PLANOS[u.plano].defesas)
    return res.status(402).json({ erro: 'Recurso disponível para assinantes.', acao: 'assinar', planos: '/v1/planos' });
  next();
}

// ---------- auth ----------
app.post('/v1/auth/register', (req, res) => {
  const { nome, cpf, email, senha } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, email e senha são obrigatórios.' });
  if (senha.length < 8) return res.status(400).json({ erro: 'Senha mínima: 8 caracteres.' });
  try {
    const hash = bcrypt.hashSync(senha, 10);
    const r = db.prepare('INSERT INTO usuarios (nome,cpf,email,senha_hash) VALUES (?,?,?,?)')
      .run(nome, cpf || null, email.toLowerCase(), hash);
    const token = jwt.sign({ id: r.lastInsertRowid, email }, SEGREDO, { expiresIn: '7d' });
    emails.enviar('boas_vindas', { id: r.lastInsertRowid, nome, email }).catch(()=>{});
    res.status(201).json({ token, usuario: { id: r.lastInsertRowid, nome, email, plano: 'gratis' },
      consentimento_lgpd: 'Registrado no cadastro. Política: /privacidade.html' });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ erro: 'E-mail ou CPF já cadastrado.' });
    res.status(500).json({ erro: 'Falha ao cadastrar.' });
  }
});

app.post('/v1/auth/login', (req, res) => {
  const { email, senha } = req.body || {};
  const u = db.prepare('SELECT * FROM usuarios WHERE email=?').get((email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(senha || '', u.senha_hash))
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  const token = jwt.sign({ id: u.id, email: u.email }, SEGREDO, { expiresIn: '7d' });
  res.json({ token, usuario: { id: u.id, nome: u.nome, email: u.email, plano: u.plano } });
});

// ---------- veículos ----------
app.post('/v1/veiculos', autenticar, (req, res) => {
  const { placa, renavam, modelo } = req.body || {};
  if (!placa) return res.status(400).json({ erro: 'placa é obrigatória.' });
  const u = db.prepare('SELECT plano FROM usuarios WHERE id=?').get(req.usuario.id);
  const qt = db.prepare('SELECT COUNT(*) c FROM veiculos WHERE usuario_id=?').get(req.usuario.id).c;
  const p = planoDe(u.plano);
  const lim = p.veiculos || 999;
  if (qt >= lim) return res.status(402).json({ erro: `Limite do plano ${p.nome}: ${lim} veículo(s).`, acao: 'upgrade ou veículo extra (+R$ 9,90/mês)' });
  const r = db.prepare('INSERT INTO veiculos (usuario_id,placa,renavam,modelo) VALUES (?,?,?,?)')
    .run(req.usuario.id, placa.toUpperCase(), renavam || null, modelo || null);
  res.status(201).json({ id: r.lastInsertRowid, placa: placa.toUpperCase(), modelo });
});
app.get('/v1/veiculos', autenticar, (req, res) => {
  res.json(db.prepare('SELECT id,placa,renavam,modelo,criado_em FROM veiculos WHERE usuario_id=?').all(req.usuario.id));
});

// ---------- multas ----------
/** Cadastro da multa. Aceita imagem (campo 'foto') — ponto de plug do OCR real. */
app.post('/v1/multas/scan', autenticar, upload.single('foto'), async (req, res) => {
  const b = req.body || {};
  // OCR REAL: foto → Google Vision (se GOOGLE_VISION_KEY) → extrator de campos.
  // Também aceita 'texto' (ex.: texto de PDF) direto no corpo. Campos enviados
  // pelo usuário SEMPRE prevalecem (confirmação manual do doc 09).
  let ex = {};
  try {
    let textoDoc = b.texto || null;
    if (!textoDoc && req.file) textoDoc = await ocrImagem(req.file.path);
    if (textoDoc) ex = extrairCampos(textoDoc);
  } catch (e) { ex = {}; }
  for (const k of ['ait','orgao','enquadramento','descricao','valor','pontos',
                   'data_infracao','data_notificacao','prazo_defesa','origem','observacao']) {
    if (b[k] === undefined && ex[k] !== undefined && ex[k] !== null) b[k] = String(ex[k]);
  }
  if (b.tem_foto === undefined && ex.tem_foto !== undefined) b.tem_foto = String(ex.tem_foto);
  if (b.campos_faltantes === undefined && ex.campos_faltantes) b.campos_faltantes = ex.campos_faltantes.join(',');
  const dados = {
    origem: b.origem === 'radar' ? 'radar' : 'agente',
    orgao_competente: b.orgao_competente !== 'false',
    afericao_validade: b.afericao_validade !== 'false',
    homologacao_ok: b.homologacao_ok !== 'false',
    estudo_tecnico_ok: b.estudo_tecnico_ok !== 'false',
    sinalizacao_ok: b.sinalizacao_ok !== 'false',
    coordenadas_ok: b.coordenadas_ok !== 'false',
    enquadramento_ok: b.enquadramento_ok !== 'false',
    circunstancias_ok: b.circunstancias_ok !== 'false',
    duplicada: b.duplicada === 'true',
    cadeia_ok: b.cadeia_ok !== 'false',
    consistencia_ok: b.consistencia_ok !== 'false',
    tem_foto: b.tem_foto === 'true',
    observacao: b.observacao || '',
    campos_faltantes: b.campos_faltantes ? String(b.campos_faltantes).split(',').filter(Boolean) : [],
    data_infracao: b.data_infracao, data_notificacao: b.data_notificacao
  };
  const r = db.prepare(`INSERT INTO multas
    (usuario_id,veiculo_id,ait,orgao,enquadramento,descricao,valor,pontos,data_infracao,data_notificacao,prazo_defesa,origem,dados_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(req.usuario.id, b.veiculo_id || null, b.ait || null, b.orgao || null, b.enquadramento || null,
      b.descricao || null, b.valor || null, b.pontos || null, b.data_infracao || null,
      b.data_notificacao || null, b.prazo_defesa || null, dados.origem, JSON.stringify(dados));
  res.status(201).json({ multa_id: r.lastInsertRowid, arquivo_recebido: !!req.file,
    ocr: Object.keys(ex).length ? { confianca: ex.confianca, campos_extraidos: Object.keys(ex).filter(k=>ex[k]!==null&&!['campos_faltantes','confianca'].includes(k)).length, revisar: ex.campos_faltantes } : null,
    proximo_passo: `/v1/multas/${r.lastInsertRowid}/diagnostico` });
});

app.get('/v1/multas', autenticar, (req, res) => {
  res.json(db.prepare('SELECT id,ait,orgao,enquadramento,descricao,valor,pontos,data_infracao,prazo_defesa,origem FROM multas WHERE usuario_id=? ORDER BY id DESC').all(req.usuario.id));
});

/** Diagnóstico: auditoria A1–A14 + jurimetria (grátis vê resumo; assinante vê tudo). */
app.get('/v1/multas/:id/diagnostico', autenticar, (req, res) => {
  const m = db.prepare('SELECT * FROM multas WHERE id=? AND usuario_id=?').get(req.params.id, req.usuario.id);
  if (!m) return res.status(404).json({ erro: 'Multa não encontrada.' });
  const dados = JSON.parse(m.dados_json || '{}');
  const verificacoes = auditar({ ...dados, origem: m.origem });
  const j = jurimetria(verificacoes);
  db.prepare('INSERT INTO diagnosticos (multa_id,verificacoes_json,probabilidade,faixa) VALUES (?,?,?,?)')
    .run(m.id, JSON.stringify(verificacoes), j.probabilidade, j.faixa);

  const u = db.prepare('SELECT plano FROM usuarios WHERE id=?').get(req.usuario.id);
  const assinante = planoDe(u.plano).defesas;
  res.json({
    multa: { id: m.id, ait: m.ait, orgao: m.orgao, valor: m.valor, prazo_defesa: m.prazo_defesa },
    verificacoes: verificacoes.map(v => ({ ...v,
      detalhe: assinante || !v.vicio ? v.detalhe : 'Vício identificado — assine para ver o fundamento completo.' })),
    vicios_encontrados: j.teses.length,
    probabilidade: assinante ? j.probabilidade : null,
    faixa: assinante ? j.faixa : 'bloqueada',
    paywall: assinante ? null : { mensagem: 'Assine para ver a probabilidade e gerar a defesa.', planos: '/v1/planos' },
    disclaimer: j.disclaimer
  });
});

// ---------- recursos / defesa ----------
app.post('/v1/recursos', autenticar, exigeAssinatura, (req, res) => {
  const { multa_id } = req.body || {};
  const m = db.prepare('SELECT m.*, v.placa FROM multas m LEFT JOIN veiculos v ON v.id=m.veiculo_id WHERE m.id=? AND m.usuario_id=?').get(multa_id, req.usuario.id);
  if (!m) return res.status(404).json({ erro: 'Multa não encontrada.' });
  const u = db.prepare('SELECT nome,cpf FROM usuarios WHERE id=?').get(req.usuario.id);
  const verificacoes = auditar({ ...JSON.parse(m.dados_json || '{}'), origem: m.origem });
  const { teses } = jurimetria(verificacoes);
  const texto = gerarDefesa({ usuario: u, multa: m, teses });
  const r = db.prepare('INSERT INTO recursos (multa_id,usuario_id,texto) VALUES (?,?,?)').run(m.id, req.usuario.id, texto);
  res.status(201).json({ recurso_id: r.lastInsertRowid, tipo: 'defesa_previa', texto,
    orientacao: 'Revise, assine e protocole em seu nome no órgão indicado. Registre o desfecho em /v1/recursos/:id/desfecho para calibrar as estimativas.' });
});
app.get('/v1/recursos', autenticar, (req, res) => {
  res.json(db.prepare('SELECT id,multa_id,tipo,status,desfecho,criado_em FROM recursos WHERE usuario_id=? ORDER BY id DESC').all(req.usuario.id));
});
/** Feedback loop da jurimetria (calibração futura). */
app.post('/v1/recursos/:id/desfecho', autenticar, (req, res) => {
  const { desfecho } = req.body || {};
  if (!['deferido', 'indeferido'].includes(desfecho)) return res.status(400).json({ erro: "desfecho: 'deferido' | 'indeferido'." });
  const r = db.prepare('UPDATE recursos SET desfecho=?, status=? WHERE id=? AND usuario_id=?')
    .run(desfecho, 'concluido', req.params.id, req.usuario.id);
  if (!r.changes) return res.status(404).json({ erro: 'Recurso não encontrado.' });
  res.json({ ok: true, mensagem: 'Desfecho registrado — obrigado! Ele alimenta a calibração das estimativas.' });
});

// ---------- jurimetria avulsa ----------
app.post('/v1/jurimetria/avaliar', autenticar, (req, res) => {
  const verificacoes = auditar(req.body || {});
  res.json({ verificacoes, ...jurimetria(verificacoes) });
});

// ---------- planos / checkout / assinatura ----------
app.get('/v1/planos', (req, res) => res.json(PLANOS));

/** Cria o checkout (demo ou Mercado Pago). */
app.post('/v1/checkout', autenticar, async (req, res) => {
  try {
    const u = db.prepare('SELECT id,email FROM usuarios WHERE id=?').get(req.usuario.id);
    const resposta = await pagamentos.criarCheckout(u, (req.body || {}).plano);
    res.json(resposta);
  } catch (e) { res.status(e.http || 500).json({ erro: e.message, detalhe: e.detalhe }); }
});

/** Webhook do gateway — a ÚNICA porta de ativação em produção. */
app.post('/v1/webhooks/pagamento', async (req, res) => {
  try { const r = await pagamentos.processarWebhook(req); res.status(r.http).json(r.resposta); }
  catch (e) { res.status(500).json({ erro: 'Falha no processamento do webhook.' }); }
});

/** Ativação direta: SOMENTE em GATEWAY=demo (testes). Em produção retorna 403. */
app.post('/v1/assinaturas/ativar', autenticar, (req, res) => {
  if (pagamentos.GATEWAY !== 'demo')
    return res.status(403).json({ erro: 'Ativação direta desabilitada. Use /v1/checkout.' });
  const { plano } = req.body || {};
  if (!PLANOS[plano] || plano === 'gratis') return res.status(400).json({ erro: 'Plano inválido.' });
  db.prepare('UPDATE usuarios SET plano=? WHERE id=?').run(plano, req.usuario.id);
  res.json({ ok: true, plano: PLANOS[plano].nome, modo: 'demo' });
});
app.post('/v1/assinaturas/cancelar', autenticar, (req, res) => {
  db.prepare("UPDATE usuarios SET plano='gratis' WHERE id=?").run(req.usuario.id);
  res.json({ ok: true, mensagem: 'Assinatura cancelada em 1 toque. Sem fidelidade.' });
});

// ---------- ADMIN (protegido por ADMIN_SECRET) ----------
function admin(req, res, next) {
  if (!conferirSegredo(req.headers['x-admin-secret'], ADMIN_SECRET))
    return res.status(401).json({ erro: 'Não autorizado.' });
  next();
}
app.get('/v1/admin/resumo', admin, (req, res) => {
  const usuarios = db.prepare('SELECT COUNT(*) c FROM usuarios').get().c;
  const assinantes = db.prepare("SELECT COUNT(*) c FROM usuarios WHERE plano!='gratis'").get().c;
  const precos = { individual: 29.90, casal: 49.90, empresa_start: 89.90, empresa_pro: 149.90, frota: 0 };
  const porPlano = db.prepare("SELECT plano, COUNT(*) c FROM usuarios WHERE plano!='gratis' GROUP BY plano").all();
  const mrr = porPlano.reduce((s, p) => s + (precos[p.plano] || 0) * p.c, 0);
  res.json({
    usuarios, assinantes, mrr,
    multas: db.prepare('SELECT COUNT(*) c FROM multas').get().c,
    recursos: db.prepare('SELECT COUNT(*) c FROM recursos').get().c,
    ultimos_usuarios: db.prepare('SELECT nome,email,plano,criado_em FROM usuarios ORDER BY id DESC LIMIT 8').all(),
    pagamentos: db.prepare('SELECT evento,plano,valor,status FROM pagamentos ORDER BY id DESC LIMIT 8').all(),
    ultimas_multas: db.prepare('SELECT ait,orgao,valor,origem FROM multas ORDER BY id DESC LIMIT 8').all(),
    emails: db.prepare('SELECT tipo,para,enviado FROM emails_log ORDER BY id DESC LIMIT 8').all(),
    varreduras: db.prepare('SELECT fonte,placas_verificadas,novas_multas,criado_em FROM varreduras ORDER BY id DESC LIMIT 5').all()
  });
});
app.post('/v1/admin/tarefas/prazos', admin, async (req, res) => {
  res.json(await emails.verificarPrazos());
});
app.post('/v1/admin/tarefas/varredura', admin, async (req, res) => {
  res.json(await monitor.varrerPlacas());
});
// tarefa automática: verifica prazos a cada 12h enquanto o serviço estiver de pé
setInterval(() => emails.verificarPrazos().catch(()=>{}), 12 * 60 * 60 * 1000);
setInterval(() => monitor.varrerPlacas().catch(()=>{}), 24 * 60 * 60 * 1000);   // varredura diária

/** Consulta pública de placa — bônus/isca (sem login). Dados ilustrativos até o credenciamento oficial. */
app.get('/v1/consulta-placa/:placa', (req, res) => {
  const placa = (req.params.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa))
    return res.status(400).json({ erro: 'Placa inválida. Formato: ABC1D23.' });
  res.json({
    placa, modo: 'demonstracao',
    aviso: 'Ambiente de demonstração — estrutura real, dados ilustrativos. As consultas oficiais entram com o credenciamento (SENATRAN/Detran).',
    veiculo: { situacao: 'REGULAR', especie: 'PASSAGEIRO' },
    resumo: {
      multas_encontradas: 1,
      valor_total: 130.16,
      licenciamento: 'EM DIA', ipva: 'QUITADO', recall: 'NENHUM', divida_ativa: 'NADA INSCRITO'
    },
    multas_teaser: [{ descricao: 'Infração média — agente de trânsito', valor: 130.16, pontos: 4, verificavel: true }],
    proximo_passo: 'Crie sua conta grátis para ver os detalhes e verificar se a multa tem vício: /app.html'
  });
});

app.get('/v1/saude', (req, res) => res.json({ ok: true, servico: 'verimulta-api', versao: '0.1.0' }));

app.listen(PORTA, () => console.log(`Verimulta API no ar: http://localhost:${PORTA} (v1)`));
