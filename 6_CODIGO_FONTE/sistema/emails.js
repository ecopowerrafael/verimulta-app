/**
 * VERIMULTA — E-mails transacionais + Alertas de prazo
 * Sem SMTP configurado → modo log (grava em emails_log, nada é enviado).
 * Produção: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_DE
 * (funciona com Zoho, Locaweb, Gmail/Workspace, Brevo, Resend-SMTP etc.)
 */
const nodemailer = require('nodemailer');
const { db } = require('./banco');

db.exec(`CREATE TABLE IF NOT EXISTS emails_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER, tipo TEXT, para TEXT, assunto TEXT,
  chave_dedup TEXT UNIQUE, enviado INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now'))
);`);

const SMTP_OK = !!process.env.SMTP_HOST;
const transporte = SMTP_OK ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
}) : null;
const DE = process.env.EMAIL_DE || 'Verimulta <contato@verimulta.com.br>';

function moldura(titulo, corpo, cta) {
  return `<!doctype html><body style="margin:0;background:#F2F4F1;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <div style="width:34px;height:34px;border-radius:9px;background:#0B3C7E;text-align:center;line-height:34px;color:#FFC933;font-weight:bold;font-size:18px">✓</div>
      <span style="font-size:20px;font-weight:800;color:#12171D">VERIMULTA</span>
    </div>
    <div style="background:#fff;border:1px solid #E3E6E0;border-radius:16px;padding:26px">
      <h1 style="font-size:21px;margin:0 0 12px;color:#12171D">${titulo}</h1>
      <div style="font-size:14.5px;color:#3A4552;line-height:1.65">${corpo}</div>
      ${cta ? `<a href="${cta.url}" style="display:inline-block;margin-top:18px;background:#FFC933;color:#12171D;font-weight:800;padding:13px 26px;border-radius:11px;text-decoration:none">${cta.rotulo}</a>` : ''}
    </div>
    <p style="font-size:11px;color:#8A96A3;margin-top:14px;line-height:1.6">
      Verimulta é plataforma de autoatendimento — probabilidades são estimativas; a decisão é do órgão julgador.
      Você recebe este e-mail por ter conta no Verimulta. Gerencie alertas no app · <a href="https://www.verimulta.com.br/privacidade.html" style="color:#0B3C7E">Privacidade (LGPD)</a>
    </p>
  </div></body>`;
}

const MODELOS = {
  boas_vindas: (u) => ({
    assunto: 'Bem-vindo(a) ao Verimulta — sua conta está ativa 🔵',
    html: moldura(`${u.nome.split(' ')[0]}, sua conta grátis está pronta!`,
      `A partir de agora, suas multas, pontos da CNH e prazos ficam vigiados na palma da mão.<br><br>
       <b>Primeiro passo:</b> fotografe qualquer notificação de multa e veja a auditoria com 14 verificações legais em 60 segundos — antes de pagar qualquer valor.`,
      { url: 'https://www.verimulta.com.br/app.html', rotulo: 'Abrir o Verimulta' })
  }),
  pagamento_confirmado: (u, extra) => ({
    assunto: `Assinatura ativada: plano ${extra.plano} ⚡`,
    html: moldura('Pagamento confirmado — tudo desbloqueado!',
      `Seu plano <b>${extra.plano}</b> está ativo. Você já pode ver probabilidades, gerar defesas ilimitadas e receber todos os alertas de prazo.<br><br>
       Renovação mensal automática. Cancele quando quiser, em 1 toque, direto no app.`,
      { url: 'https://www.verimulta.com.br/app.html', rotulo: 'Usar agora' })
  }),
  nova_multa: (u, extra) => ({
    assunto: `🚨 Nova multa encontrada na placa ${extra.placa} — verifique antes de pagar`,
    html: moldura(`Encontramos uma nova multa na placa ${extra.placa}`,
      `<b>${extra.descricao || 'Autuação'}</b> · AIT ${extra.ait} · R$ ${Number(extra.valor||0).toFixed(2).replace('.',',')}<br>
       Prazo para a Defesa Prévia: <b>${extra.prazo || 'confira na notificação'}</b>.<br><br>
       Antes de pagar qualquer valor, rode a auditoria: em 60 segundos você vê se ela tem vício e qual a probabilidade real de defesa.`,
      { url: 'https://www.verimulta.com.br/app.html', rotulo: 'Verificar esta multa agora' })
  }),
  alerta_prazo: (u, extra) => ({
    assunto: `⏰ Faltam ${extra.dias} dia(s): prazo da defesa da multa ${extra.ait || ''}`,
    html: moldura(`O prazo da sua defesa vence em ${extra.dias} dia(s)`,
      `A multa <b>${extra.ait || ''}</b> (${extra.descricao || 'autuação'}) tem defesa prévia até <b>${extra.prazo}</b>.<br><br>
       Depois dessa data, a chance de contestar nesta fase se perde. Abra o app, revise sua defesa e protocole a tempo.`,
      { url: 'https://www.verimulta.com.br/app.html', rotulo: 'Ver minha defesa' })
  })
};

/** Envia (ou registra) um e-mail. chave_dedup evita repetição do mesmo aviso. */
async function enviar(tipo, usuario, extra = {}, chave_dedup = null) {
  const modelo = MODELOS[tipo];
  if (!modelo || !usuario || !usuario.email) return { ok: false };
  const { assunto, html } = modelo(usuario, extra);
  const chave = chave_dedup || `${tipo}:${usuario.id}:${new Date().toISOString().slice(0, 10)}`;
  try {
    db.prepare('INSERT INTO emails_log (usuario_id,tipo,para,assunto,chave_dedup,enviado) VALUES (?,?,?,?,?,?)')
      .run(usuario.id, tipo, usuario.email, assunto, chave, SMTP_OK ? 1 : 0);
  } catch (e) {
    // Só a violação do UNIQUE em chave_dedup significa "já enviado". Qualquer
    // outro erro (banco em disco cheio, tabela travada) era engolido aqui como
    // se fosse deduplicação, e a falha real nunca aparecia em lugar nenhum.
    if (String(e.code || e.message).includes('SQLITE_CONSTRAINT'))
      return { ok: true, deduplicado: true };
    console.error('[emails] falha ao registrar envio:', e.message);
    return { ok: false, erro: 'Falha ao registrar o envio.' };
  }
  if (SMTP_OK) {
    try { await transporte.sendMail({ from: DE, to: usuario.email, subject: assunto, html }); }
    catch (e) { db.prepare('UPDATE emails_log SET enviado=0 WHERE chave_dedup=?').run(chave); return { ok: false, erro: String(e) }; }
  }
  return { ok: true, modo: SMTP_OK ? 'smtp' : 'log' };
}

/** Tarefa diária: alerta de prazos de defesa em 7, 3 e 1 dia(s). */
async function verificarPrazos() {
  const janelas = [7, 3, 1];
  let disparados = 0;
  for (const dias of janelas) {
    const alvo = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    const linhas = db.prepare(`SELECT m.id, m.ait, m.descricao, m.prazo_defesa, u.id uid, u.nome, u.email
      FROM multas m JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.prazo_defesa = ?`).all(alvo);
    for (const l of linhas) {
      const r = await enviar('alerta_prazo',
        { id: l.uid, nome: l.nome, email: l.email },
        { dias, ait: l.ait, descricao: l.descricao, prazo: l.prazo_defesa.split('-').reverse().join('/') },
        `alerta_prazo:${l.uid}:${l.id}:${dias}`);
      if (r.ok && !r.deduplicado) disparados++;
    }
  }
  return { disparados };
}

module.exports = { enviar, verificarPrazos, SMTP_OK };
