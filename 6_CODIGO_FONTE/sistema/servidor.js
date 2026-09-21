/** VERIMULTA — API v1 · Node/Express · JWT · SQLite */
require('./ambiente');   // carrega o .env local ANTES de qualquer módulo ler process.env
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
const fontes = require('./fontes');
const { PLANOS, planoDe, precoDe, chaveDe } = require('./planos');
const { JWT_SECRET, ADMIN_SECRET, conferirSegredo, PRODUCAO } = require('./config');
const { limitar, cors, cabecalhos, ipDe } = require('./seguranca');
const { defesaPDF, extratoPDF } = require('./pdf');
const { dataLocal, hoje, diasAte } = require('./datas');
const fs = require('fs');
const QRCode = require('qrcode');

/** Versão do termo aceito no cadastro — muda quando o texto dos Termos mudar. */
const VERSAO_TERMOS = process.env.VERSAO_TERMOS || '2026-09-20';
/** Versão do app, gravada junto de cada feedback do beta. */
const VERSAO_APP = process.env.VERSAO_APP || '1.0.0-beta';

const SEGREDO = JWT_SECRET;
const PORTA = process.env.PORT || 3000;
const app = express();
app.set('trust proxy', 1);              // atrás do proxy do Render: IP real no X-Forwarded-For
app.use(cabecalhos);                    // nosniff, DENY em iframe, HSTS em produção
app.use(cors);                          // allowlist via ORIGENS_PERMITIDAS (nunca "*")
app.use(express.static(__dirname + '/publico'));   // site + app servidos junto da API
app.use(express.json({ limit: '2mb' }));

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (TIPOS_ACEITOS.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Envie uma foto (JPG, PNG, WEBP, HEIC) ou um PDF.'), { http: 400 }));
  }
});

/** Apaga o arquivo temporário do upload — o multer não limpa sozinho. */
function descartar(arquivo) {
  if (arquivo && arquivo.path) fs.promises.unlink(arquivo.path).catch(() => {});
}

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
app.post('/v1/auth/register', limitar('register', 5, 600), (req, res) => {
  const { nome, cpf, email, senha, consentimento } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, email e senha são obrigatórios.' });
  if (senha.length < 8) return res.status(400).json({ erro: 'Senha mínima: 8 caracteres.' });
  // LGPD art. 8º: consentimento é manifestação INEQUÍVOCA. Sem o aceite explícito
  // não há cadastro — e o aceite fica gravado com data, IP e versão do termo,
  // porque o ônus de prová-lo é do controlador (art. 8º §2º).
  if (consentimento !== true && consentimento !== 'true')
    return res.status(400).json({
      erro: 'É preciso aceitar os Termos de Uso e a Política de Privacidade para criar a conta.',
      campo: 'consentimento', termos: '/termos.html', privacidade: '/privacidade.html'
    });
  try {
    const hash = bcrypt.hashSync(senha, 10);
    const r = db.prepare(`INSERT INTO usuarios
      (nome,cpf,email,senha_hash,consentimento_lgpd,consentimento_em,consentimento_ip,consentimento_versao)
      VALUES (?,?,?,?,1,datetime('now'),?,?)`)
      .run(nome, cpf || null, email.toLowerCase(), hash, ipDe(req), VERSAO_TERMOS);
    const token = jwt.sign({ id: r.lastInsertRowid, email }, SEGREDO, { expiresIn: '7d' });
    emails.enviar('boas_vindas', { id: r.lastInsertRowid, nome, email }).catch(()=>{});
    res.status(201).json({ token, usuario: { id: r.lastInsertRowid, nome, email, plano: 'gratis' },
      consentimento_lgpd: { registrado: true, versao_termos: VERSAO_TERMOS, politica: '/privacidade.html' } });
  } catch (e) {
    if (String(e).includes('UNIQUE')) return res.status(409).json({ erro: 'E-mail ou CPF já cadastrado.' });
    res.status(500).json({ erro: 'Falha ao cadastrar.' });
  }
});

app.post('/v1/auth/login', limitar('login', 8, 300), (req, res) => {
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
/**
 * Pré-leitura do documento: roda o OCR e devolve os campos SEM gravar nada.
 *
 * Existia só o /scan, que lia e gravava na mesma chamada. Como o aplicativo
 * mandava todos os campos junto e o servidor só usa o OCR para preencher o que
 * veio vazio, o resultado da leitura era sempre descartado. Separar leitura de
 * gravação resolve isso na raiz: o usuário vê o que foi lido, corrige o que
 * estiver errado, e só então a multa é criada.
 */
app.post('/v1/multas/ler', autenticar, limitar('ler', 40, 600), upload.single('foto'), async (req, res) => {
  const corpo = req.body || {};
  let texto = corpo.texto || null;
  let origemTexto = texto ? 'texto informado' : null;

  try {
    if (!texto && req.file) {
      texto = await ocrImagem(req.file.path);
      origemTexto = texto ? 'OCR da foto' : null;
    }
  } catch (e) {
    console.error('[scan] OCR falhou:', e.message);
  } finally {
    descartar(req.file);
  }

  if (!texto) {
    // Sem chave do Vision, sem texto legível ou com o serviço fora do ar.
    // Dizer isso é melhor que devolver campos vazios como se fossem leitura.
    return res.json({
      leu: false,
      motivo: process.env.GOOGLE_VISION_KEY
        ? 'Não conseguimos ler o documento desta foto.'
        : 'A leitura automática de fotos ainda não está ligada neste ambiente.',
      orientacao: 'Preencha os campos da notificação à mão — a auditoria funciona igual.',
      campos: {}
    });
  }

  const campos = extrairCampos(texto);
  const preenchidos = Object.entries(campos)
    .filter(([k, v]) => v !== null && v !== undefined && !['campos_faltantes', 'confianca'].includes(k));

  res.json({
    leu: preenchidos.length > 0,
    origem: origemTexto,
    confianca: campos.confianca ?? null,
    campos_extraidos: preenchidos.length,
    revisar: campos.campos_faltantes || [],
    campos,
    orientacao: 'Confira cada campo antes de continuar. O que estiver errado aqui entra errado na defesa.'
  });
});

/** Cadastro da multa. Aceita imagem (campo 'foto') — ponto de plug do OCR real. */
app.post('/v1/multas/scan', autenticar, limitar('scan', 30, 600), upload.single('foto'), async (req, res) => {
  const b = req.body || {};
  // IDOR: sem esta checagem a multa podia ser amarrada ao veículo de outra
  // pessoa, e a placa alheia vazava no texto da Defesa Prévia (LEFT JOIN de
  // /v1/recursos). O veículo tem de ser do próprio usuário.
  if (b.veiculo_id) {
    const meu = db.prepare('SELECT id FROM veiculos WHERE id=? AND usuario_id=?')
      .get(b.veiculo_id, req.usuario.id);
    if (!meu) { descartar(req.file); return res.status(404).json({ erro: 'Veículo não encontrado.' }); }
  }
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
  descartar(req.file);   // o arquivo já virou texto: não fica no disco
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
    indice: j.indice,                                  // manchete: o número é só apoio
    vicios_encontrados: j.teses.length,
    probabilidade: assinante ? j.probabilidade : null,
    faixa: assinante ? j.faixa : 'bloqueada',
    nota_correlacao: assinante ? j.nota_correlacao : '',
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

/** Defesa Prévia em PDF timbrado, gerada no servidor (sai igual em qualquer aparelho). */
app.get('/v1/recursos/:id/pdf', autenticar, exigeAssinatura, async (req, res) => {
  const r = db.prepare(`SELECT r.texto, m.ait FROM recursos r
    JOIN multas m ON m.id = r.multa_id
    WHERE r.id=? AND r.usuario_id=?`).get(req.params.id, req.usuario.id);
  if (!r) return res.status(404).json({ erro: 'Recurso não encontrado.' });
  try {
    const pdf = await defesaPDF({ texto: r.texto, ait: r.ait });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="defesa-previa-${(r.ait || 'verimulta').replace(/[^A-Za-z0-9]/g, '')}.pdf"`);
    res.send(pdf);
  } catch (e) { res.status(500).json({ erro: 'Falha ao gerar o PDF.' }); }
});

/** Extrato de Auditoria em PDF: as 14 verificações com a base legal de cada uma. */
app.get('/v1/multas/:id/extrato.pdf', autenticar, exigeAssinatura, async (req, res) => {
  const m = db.prepare(`SELECT m.*, v.placa FROM multas m
    LEFT JOIN veiculos v ON v.id = m.veiculo_id
    WHERE m.id=? AND m.usuario_id=?`).get(req.params.id, req.usuario.id);
  if (!m) return res.status(404).json({ erro: 'Multa não encontrada.' });
  const u = db.prepare('SELECT nome,cpf FROM usuarios WHERE id=?').get(req.usuario.id);
  const verificacoes = auditar({ ...JSON.parse(m.dados_json || '{}'), origem: m.origem });
  try {
    const pdf = await extratoPDF({ usuario: u, multa: m, verificacoes, jurimetria: jurimetria(verificacoes) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="extrato-auditoria-${(m.ait || 'verimulta').replace(/[^A-Za-z0-9]/g, '')}.pdf"`);
    res.send(pdf);
  } catch (e) { res.status(500).json({ erro: 'Falha ao gerar o PDF.' }); }
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

/**
 * Webhook do gateway — a ÚNICA porta de ativação em produção.
 * Responde nos DOIS endereços: /v1/webhooks/pagamento (histórico) e
 * /v1/webhooks/mercadopago (o que os manuais mandam cadastrar no painel do MP).
 * Antes só existia o primeiro: quem seguisse o manual cadastrava um 404 e o
 * cliente pagava sem nunca ter o plano liberado.
 */
async function receberWebhook(req, res) {
  try { const r = await pagamentos.processarWebhook(req); res.status(r.http).json(r.resposta); }
  catch (e) { res.status(500).json({ erro: 'Falha no processamento do webhook.' }); }
}
app.post('/v1/webhooks/pagamento', receberWebhook);
app.post('/v1/webhooks/mercadopago', receberWebhook);

/** Ativação direta: SOMENTE em GATEWAY=demo (testes). Em produção retorna 403. */
app.post('/v1/assinaturas/ativar', autenticar, (req, res) => {
  // Dupla trava. Antes bastava GATEWAY=demo para liberar plano pago de graça —
  // e demo é justamente o padrão do render.yaml. Em produção a rota não abre,
  // qualquer que seja o gateway: a única porta de ativação é o webhook.
  if (PRODUCAO)
    return res.status(403).json({ erro: 'Ativação direta desabilitada em produção. Use /v1/checkout.' });
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
  // Preço vem de planos.js — a tabela local aqui ficava desatualizada a cada
  // mudança de grade e o MRR do painel saía errado.
  const porPlano = db.prepare("SELECT plano, COUNT(*) c FROM usuarios WHERE plano!='gratis' GROUP BY plano").all();
  const mrr = Number(porPlano.reduce((s, p) => s + precoDe(p.plano) * p.c, 0).toFixed(2));
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
app.get('/v1/consulta-placa/:placa', limitar('placa', 20, 300), (req, res) => {
  const placa = (req.params.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa))
    return res.status(400).json({ erro: 'Placa inválida. Formato: ABC1D23.' });
  // Antes esta rota devolvia uma multa fabricada (1 multa, R$ 130,16) e
  // "IPVA QUITADO" para QUALQUER placa, pública e sem login. Com usuários
  // reais isso afirma um fato sobre o veículo de outra pessoa sem ter
  // consultado nada — e contraria a regra da casa: nunca inventar multa.
  // A rota continua existindo como porta de entrada, mas não afirma nada.
  res.json({
    placa,
    consulta_oficial: false,
    situacao: 'nao_conectada',
    aviso: 'Ainda não consultamos bases oficiais: o acesso a RENAVAM/RENAINF depende do credenciamento SENATRAN/Serpro, em andamento. Não afirmamos nada sobre este veículo sem ter consultado.',
    o_que_ja_funciona: 'Envie a foto da notificação: o app lê o documento, roda as 14 verificações com base legal e monta a Defesa Prévia.',
    proximo_passo: 'Crie sua conta grátis e verifique sua multa pelo documento: /app.html'
  });
});

// ---------- CNH: pontuação real, calculada do que o usuário registrou ----------
/**
 * Pontos dos últimos 12 meses, somados das multas do próprio usuário.
 * NÃO é consulta ao Detran: é a conta do que está cadastrado aqui, e a
 * resposta diz isso em `origem`. O limite segue o CTB art. 261 §1º com a
 * redação da Lei 14.071/2020 — 20 pontos com duas ou mais gravíssimas,
 * 30 com uma, 40 sem nenhuma.
 */
app.get('/v1/cnh', autenticar, (req, res) => {
  const desde = dataLocal(-365);
  const multas = db.prepare(`SELECT id, ait, descricao, pontos, data_infracao
    FROM multas WHERE usuario_id=? AND data_infracao IS NOT NULL AND data_infracao >= ?
    ORDER BY data_infracao DESC`).all(req.usuario.id, desde);

  const comPontos = multas.filter(m => Number.isFinite(m.pontos) && m.pontos > 0);
  const semPontos = multas.length - comPontos.length;
  const pontos = comPontos.reduce((s, m) => s + m.pontos, 0);
  const gravissimas = comPontos.filter(m => m.pontos === 7).length;
  const limite = gravissimas >= 2 ? 20 : gravissimas === 1 ? 30 : 40;

  const u = db.prepare('SELECT cnh_validade FROM usuarios WHERE id=?').get(req.usuario.id);

  res.json({
    pontos, limite, gravissimas,
    restam: Math.max(0, limite - pontos),
    situacao: pontos >= limite ? 'limite atingido' : pontos >= limite * 0.75 ? 'atenção' : 'regular',
    janela: { de: desde, ate: hoje() },
    multas_consideradas: comPontos.length,
    multas_sem_pontuacao: semPontos,
    cnh_validade: u ? u.cnh_validade : null,
    dias_para_vencer_cnh: u && u.cnh_validade ? diasAte(u.cnh_validade) : null,
    origem: 'multas cadastradas neste aplicativo',
    aviso: semPontos
      ? `${semPontos} multa(s) sem pontuação identificada ainda não entram na conta — confirme o enquadramento para incluir.`
      : 'A conta considera apenas as multas cadastradas aqui. A pontuação oficial é a do Detran.'
  });
});

/** O titular informa a validade da própria CNH (não há fonte oficial ligada). */
app.post('/v1/cnh', autenticar, (req, res) => {
  const { validade } = req.body || {};
  if (validade !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(validade || '')))
    return res.status(400).json({ erro: 'validade: use o formato AAAA-MM-DD, ou null para limpar.' });
  db.prepare('UPDATE usuarios SET cnh_validade=? WHERE id=?').run(validade || null, req.usuario.id);
  res.json({ ok: true, cnh_validade: validade || null });
});

/** Resumo do veículo: só o que a plataforma realmente sabe. */
app.get('/v1/veiculos/:id/resumo', autenticar, (req, res) => {
  const v = db.prepare('SELECT * FROM veiculos WHERE id=? AND usuario_id=?').get(req.params.id, req.usuario.id);
  if (!v) return res.status(404).json({ erro: 'Veículo não encontrado.' });
  const m = db.prepare(`SELECT COUNT(*) c, COALESCE(SUM(valor),0) t FROM multas
    WHERE usuario_id=? AND veiculo_id=?`).get(req.usuario.id, v.id);
  const ultimas = db.prepare(`SELECT ait, descricao, valor, data_infracao FROM multas
    WHERE usuario_id=? AND veiculo_id=? ORDER BY COALESCE(data_infracao,'') DESC LIMIT 5`)
    .all(req.usuario.id, v.id);
  res.json({
    veiculo: { id: v.id, placa: v.placa, modelo: v.modelo, renavam: v.renavam },
    multas: { quantidade: m.c, valor_total: Number(m.t.toFixed(2)), ultimas },
    // Sem convênio com o Detran não há de onde tirar estes itens. Declarar
    // "não conectado" é a única resposta honesta — o app não inventa.
    nao_conectado: {
      itens: ['licenciamento', 'IPVA', 'recall', 'dívida ativa'],
      motivo: 'A consulta oficial depende do credenciamento SENATRAN/Detran, ainda em andamento.',
      enquanto_isso: 'Envie a notificação pelo scan: a auditoria e a defesa funcionam por documento.'
    }
  });
});

// ---------- FONTES DE DADOS ----------
/**
 * Retrato honesto do que está ligado. O app usa isto para dizer, em cada
 * tela, se aquele número veio de uma base oficial, de fonte pública ou de
 * lugar nenhum — em vez de deixar o usuário supor.
 */
app.get('/v1/fontes', (req, res) => {
  const estado = fontes.estado();
  res.json({
    fontes: estado,
    oficiais_ligadas: estado.filter(f => f.ativa && f.oficial).length,
    resumo: estado.some(f => f.ativa && f.oficial)
      ? 'Consulta oficial ligada.'
      : 'Nenhuma base oficial ligada: RENAVAM, RENACH e RENAINF dependem de '
        + 'autorização no SENATRAN e contrato com o Serpro. O app funciona por '
        + 'documento enviado pelo usuário.'
  });
});

/** Marcas da tabela FIPE (carros, motos ou caminhoes). */
app.get('/v1/fipe/marcas', limitar('fipe', 60, 600), async (req, res) => {
  const r = await fontes.consultar('valor_fipe', { tipo: req.query.tipo || 'carros' });
  if (!r.ok) return res.status(503).json({ erro: r.mensagem || 'Tabela FIPE indisponível agora.' });
  res.json({ origem: r.rotulo, marcas: r.dados.marcas });
});

/** Modelos de uma marca. */
app.get('/v1/fipe/modelos/:marca', limitar('fipe', 60, 600), async (req, res) => {
  const r = await fontes.consultar('valor_fipe', { tipo: req.query.tipo || 'carros', marca: req.params.marca });
  if (!r.ok) return res.status(503).json({ erro: r.mensagem || 'Tabela FIPE indisponível agora.' });
  res.json({ origem: r.rotulo, modelos: r.dados.modelos });
});

/** Preço de referência por código FIPE. */
app.get('/v1/fipe/preco/:codigo', limitar('fipe', 60, 600), async (req, res) => {
  const r = await fontes.consultar('valor_fipe', { codigo_fipe: req.params.codigo });
  if (!r.ok) return res.status(503).json({ erro: 'Não conseguimos consultar a FIPE agora. Tente mais tarde.' });
  res.json({ origem: r.rotulo, precos: r.dados.precos });
});

/**
 * Consulta de veículo na fonte externa configurada.
 * Sem fornecedor configurado devolve 503 dizendo o que falta — nunca um
 * resultado de mentira para a tela ter o que mostrar.
 */
app.get('/v1/veiculos/:id/consulta-externa', autenticar, limitar('externa', 30, 600), async (req, res) => {
  const v = db.prepare('SELECT * FROM veiculos WHERE id=? AND usuario_id=?').get(req.params.id, req.usuario.id);
  if (!v) return res.status(404).json({ erro: 'Veículo não encontrado.' });
  const r = await fontes.consultar('veiculo', { placa: v.placa, renavam: v.renavam || '' });
  if (!r.ok) {
    return res.status(503).json({
      consultado: false, erro: r.erro, mensagem: r.mensagem,
      o_que_falta: 'Configurar uma fonte autorizada (ver /v1/fontes).'
    });
  }
  res.json({ consultado: true, origem: r.rotulo, oficial: r.oficial, dados: r.dados });
});

// ---------- FEEDBACK DO BETA ----------
/**
 * Canal de feedback do beta fechado. O objetivo do teste de 30 dias é
 * descobrir onde o app confunde ou falha — sem um canal dentro do app, o
 * retorno se perde em conversas de WhatsApp e nunca vira correção.
 *
 * Guarda a tela de origem e a versão, para o relato chegar com contexto.
 */
app.post('/v1/feedback', autenticar, limitar('feedback', 20, 3600), (req, res) => {
  const { tela, nota, texto } = req.body || {};
  const comentario = String(texto || '').trim();
  const avaliacao = Number(nota);
  if (!comentario && !Number.isFinite(avaliacao))
    return res.status(400).json({ erro: 'Escreva um comentário ou dê uma nota.' });
  if (comentario.length > 4000)
    return res.status(400).json({ erro: 'Comentário muito longo (máximo 4000 caracteres).' });
  if (Number.isFinite(avaliacao) && (avaliacao < 1 || avaliacao > 5))
    return res.status(400).json({ erro: 'nota: de 1 a 5.' });

  const r = db.prepare(`INSERT INTO feedbacks (usuario_id, tela, nota, texto, versao)
    VALUES (?,?,?,?,?)`).run(
    req.usuario.id,
    String(tela || 'não informada').slice(0, 60),
    Number.isFinite(avaliacao) ? avaliacao : null,
    comentario || null,
    VERSAO_APP
  );
  res.status(201).json({
    ok: true, id: r.lastInsertRowid,
    mensagem: 'Recebido. Obrigado — é isso que faz o app melhorar durante o beta.'
  });
});

/** O que o próprio usuário já mandou (transparência: ele vê o que enviou). */
app.get('/v1/feedback', autenticar, (req, res) => {
  res.json(db.prepare(`SELECT id, tela, nota, texto, criado_em FROM feedbacks
    WHERE usuario_id=? ORDER BY id DESC LIMIT 50`).all(req.usuario.id));
});

/** Painel do Dono: todo o retorno do beta, do mais recente para o mais antigo. */
app.get('/v1/admin/feedbacks', admin, (req, res) => {
  const lista = db.prepare(`SELECT f.id, f.tela, f.nota, f.texto, f.versao, f.criado_em,
      u.nome, u.email
    FROM feedbacks f LEFT JOIN usuarios u ON u.id = f.usuario_id
    ORDER BY f.id DESC LIMIT 200`).all();
  const notas = lista.filter(f => Number.isFinite(f.nota)).map(f => f.nota);
  res.json({
    total: lista.length,
    nota_media: notas.length ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)) : null,
    por_tela: Object.entries(lista.reduce((acc, f) => {
      acc[f.tela] = (acc[f.tela] || 0) + 1; return acc;
    }, {})).sort((a, b) => b[1] - a[1]),
    itens: lista
  });
});

// ---------- DIREITOS DO TITULAR (LGPD art. 18) ----------
/** Portabilidade/acesso: devolve tudo o que a plataforma guarda sobre o titular. */
app.get('/v1/eu/dados', autenticar, (req, res) => {
  const id = req.usuario.id;
  const u = db.prepare(`SELECT id,nome,cpf,email,plano,criado_em,
    consentimento_lgpd,consentimento_em,consentimento_versao FROM usuarios WHERE id=?`).get(id);
  if (!u) return res.status(404).json({ erro: 'Conta não encontrada.' });
  res.setHeader('Content-Disposition', 'attachment; filename="meus-dados-verimulta.json"');
  res.json({
    gerado_em: new Date().toISOString(),
    controlador: 'PRIMECORP BROKERS LTDA · CNPJ 55.745.297/0001-06',
    titular: u,
    veiculos: db.prepare('SELECT id,placa,renavam,modelo,criado_em FROM veiculos WHERE usuario_id=?').all(id),
    multas: db.prepare('SELECT id,ait,orgao,enquadramento,descricao,valor,data_infracao,criado_em FROM multas WHERE usuario_id=?').all(id),
    recursos: db.prepare('SELECT id,multa_id,tipo,status,desfecho,texto,criado_em FROM recursos WHERE usuario_id=?').all(id),
    pagamentos: db.prepare('SELECT plano,valor,evento,status,criado_em FROM pagamentos WHERE usuario_id=?').all(id)
  });
});

/**
 * Eliminação (art. 18, VI). Anonimiza em vez de apagar: o histórico de
 * pagamento precisa sobreviver por obrigação fiscal (art. 16, I), mas deixa
 * de estar ligado a uma pessoa identificável.
 */
app.delete('/v1/eu/conta', autenticar, limitar('excluir', 3, 3600), (req, res) => {
  const id = req.usuario.id;
  const u = db.prepare('SELECT id,plano FROM usuarios WHERE id=?').get(id);
  if (!u) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (u.plano !== 'gratis')
    return res.status(409).json({ erro: 'Cancele a assinatura antes de excluir a conta.', acao: '/v1/assinaturas/cancelar' });

  const anonimizar = db.transaction(() => {
    db.prepare('DELETE FROM recursos WHERE usuario_id=?').run(id);
    db.prepare('DELETE FROM diagnosticos WHERE multa_id IN (SELECT id FROM multas WHERE usuario_id=?)').run(id);
    db.prepare('DELETE FROM multas WHERE usuario_id=?').run(id);
    db.prepare('DELETE FROM veiculos WHERE usuario_id=?').run(id);
    db.prepare(`UPDATE usuarios SET nome='(titular excluído)', cpf=NULL,
      email='excluido-' || id || '@anonimizado.local', senha_hash='',
      plano='gratis', anonimizado_em=datetime('now') WHERE id=?`).run(id);
  });
  anonimizar();
  res.json({ ok: true,
    mensagem: 'Conta excluída. Dados pessoais anonimizados; o histórico de pagamento é mantido apenas para cumprimento de obrigação fiscal (LGPD art. 16, I).' });
});

// ---------- tratamento de erro (upload e afins) ----------
app.use((err, req, res, next) => {
  if (req.file) descartar(req.file);
  if (err && err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ erro: 'Arquivo maior que 8 MB. Envie uma foto menor.' });
  if (err && err.http) return res.status(err.http).json({ erro: err.message });
  console.error('[erro]', err && err.message);
  res.status(500).json({ erro: 'Falha no processamento da requisição.' });
});

/**
 * QR Code do endereço de instalação, para compartilhar com os testadores.
 * Usa URL_BASE quando definida (produção) e, fora dela, a própria origem da
 * requisição — assim o QR aberto no servidor de casa já aponta para o
 * endereço certo, sem ninguém precisar digitar nada.
 */
app.get('/v1/qr.svg', async (req, res) => {
  const base = process.env.URL_BASE || `${req.protocol}://${req.get('host')}`;
  const destino = `${base.replace(/\/$/, '')}/instalar.html`;
  try {
    const svg = await QRCode.toString(destino, { type: 'svg', margin: 1, width: 320,
      color: { dark: '#0B3C7E', light: '#FFFFFF' } });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-store');
    res.send(svg);
  } catch (e) { res.status(500).json({ erro: 'Falha ao gerar o QR Code.' }); }
});

/** O endereço que os testadores devem abrir no celular. */
app.get('/v1/endereco', (req, res) => {
  const base = process.env.URL_BASE || `${req.protocol}://${req.get('host')}`;
  res.json({
    base: base.replace(/\/$/, ''),
    instalar: `${base.replace(/\/$/, '')}/instalar.html`,
    app: `${base.replace(/\/$/, '')}/app.html`,
    qr: '/v1/qr.svg'
  });
});

app.get('/v1/saude', (req, res) => res.json({ ok: true, servico: 'verimulta-api', versao: VERSAO_APP }));

app.listen(PORTA, () => console.log(`Verimulta API no ar: http://localhost:${PORTA} (v1)`));
