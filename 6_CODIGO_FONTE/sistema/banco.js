/** VERIMULTA — Banco (SQLite) + Gerador de Defesa Prévia */
const Database = require('better-sqlite3');
const db = new Database(process.env.DB_PATH || './verimulta.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL, cpf TEXT UNIQUE, email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL, plano TEXT DEFAULT 'gratis',
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  placa TEXT NOT NULL, renavam TEXT, modelo TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS multas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  veiculo_id INTEGER REFERENCES veiculos(id),
  ait TEXT, orgao TEXT, enquadramento TEXT, descricao TEXT,
  valor REAL, pontos INTEGER,
  data_infracao TEXT, data_notificacao TEXT, prazo_defesa TEXT,
  origem TEXT DEFAULT 'agente',           -- 'radar' | 'agente'
  dados_json TEXT,                        -- campos da auditoria
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS diagnosticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  multa_id INTEGER NOT NULL REFERENCES multas(id),
  verificacoes_json TEXT NOT NULL, probabilidade INTEGER, faixa TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS recursos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  multa_id INTEGER NOT NULL REFERENCES multas(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  tipo TEXT DEFAULT 'defesa_previa',
  texto TEXT NOT NULL, status TEXT DEFAULT 'gerado',
  desfecho TEXT,                          -- deferido | indeferido (calibração)
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  tela TEXT, nota INTEGER, texto TEXT, versao TEXT,
  criado_em TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_multa_user ON multas(usuario_id);
CREATE INDEX IF NOT EXISTS ix_veic_user ON veiculos(usuario_id);
CREATE INDEX IF NOT EXISTS ix_rec_user ON recursos(usuario_id);
CREATE INDEX IF NOT EXISTS ix_diag_multa ON diagnosticos(multa_id);
`);

/**
 * Migrações idempotentes — adicionam coluna só se ela ainda não existir.
 * Bancos criados antes desta versão continuam abrindo normalmente.
 */
function migrarColuna(tabela, coluna, definicao) {
  const existe = db.prepare(`PRAGMA table_info(${tabela})`).all().some(c => c.name === coluna);
  if (!existe) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
}

// LGPD art. 8º §2º: o ônus de provar o consentimento é do controlador. A API
// respondia "consentimento registrado" sem gravar nada em lugar nenhum.
migrarColuna('usuarios', 'consentimento_lgpd', "INTEGER DEFAULT 0");
migrarColuna('usuarios', 'consentimento_em',   "TEXT");
migrarColuna('usuarios', 'consentimento_ip',   "TEXT");
migrarColuna('usuarios', 'consentimento_versao', "TEXT");
// Direito de eliminação (art. 18, VI): a conta é anonimizada, não apagada em
// silêncio — os registros fiscais do pagamento precisam sobreviver.
migrarColuna('usuarios', 'anonimizado_em', "TEXT");
// Validade da CNH informada pelo próprio titular. Sem credenciamento oficial
// não há de onde puxar — e inventar uma data de vencimento de habilitação
// seria pior do que não mostrar nada.
migrarColuna('usuarios', 'cnh_validade', "TEXT");

/** Gera o texto da Defesa Prévia a partir do diagnóstico. */
function gerarDefesa({ usuario, multa, teses }) {
  const fund = teses.length
    ? teses.map((t, i) =>
        `${i + 1}. ${t.detalhe} Fundamento: ${t.base_legal} (verificação ${t.codigo}).`
      ).join('\n')
    : '1. [Exponha aqui a sua versão dos fatos, anexando as provas de que dispõe.]';

  return `AO ÓRGÃO DE TRÂNSITO — ${multa.orgao || '[ÓRGÃO AUTUADOR]'}

DEFESA PRÉVIA — Auto de Infração nº ${multa.ait || '[Nº DO AIT]'}
Requerente: ${usuario.nome} — CPF ${usuario.cpf || '[CPF]'}
Veículo/Placa: ${multa.placa || '[PLACA]'} · Enquadramento: ${multa.enquadramento || '[CÓDIGO]'}
Data da infração: ${multa.data_infracao || '[DATA]'}

O(A) requerente, com fundamento no art. 281 e seguintes do Código de Trânsito
Brasileiro, vem, tempestivamente, apresentar DEFESA PRÉVIA em face da autuação
em epígrafe, pelos fundamentos de fato e de direito a seguir:

${fund}

Diante do exposto, requer o ACOLHIMENTO da presente defesa, com o consequente
ARQUIVAMENTO do auto de infração, nos termos da legislação vigente.

Nestes termos, pede deferimento.

________________________________
${usuario.nome}
(protocolado pelo(a) próprio(a) requerente, em seu nome)

— Documento organizado pela plataforma Verimulta (autoatendimento).
As probabilidades apresentadas no diagnóstico são estimativas; a decisão
sobre a autuação é exclusiva do órgão julgador.`;
}

module.exports = { db, gerarDefesa, migrarColuna };
