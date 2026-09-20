/**
 * VERIMULTA — Motor de Monitoramento (varredura de placas)
 * Roda diariamente: reconsulta cada placa cadastrada nas FONTES ativas,
 * detecta multas NOVAS (dedup por AIT+placa), grava no banco e dispara
 * o alerta "nova multa encontrada" (e-mail + registro).
 *
 * FONTES PLUGÁVEIS — regra de honestidade: NUNCA inventar multa.
 *  - 'demo'   : só emite detecção se DEMO_NOVA_MULTA=true (testes/homologação)
 *  - 'detran' : plug para integração credenciada (implementar ao obter convênio)
 *  - 'sne'    : plug para SNE/Senatran mediante adesão
 * Produção sem credenciamento: varredura roda, registra "0 novas" e mantém
 * a trilha — o alerta de PRAZOS continua ativo independente (emails.js).
 */
const { db } = require('./banco');
const emails = require('./emails');

db.exec(`CREATE TABLE IF NOT EXISTS varreduras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT, placas_verificadas INTEGER, novas_multas INTEGER,
  detalhe TEXT, criado_em TEXT DEFAULT (datetime('now'))
);`);
try { db.exec("ALTER TABLE multas ADD COLUMN detectada_por TEXT"); } catch (e) {}

// -------- FONTES --------
const FONTES = {
  /** Fonte de demonstração: detecta 1 multa simulada por placa SOMENTE se DEMO_NOVA_MULTA=true. */
  demo: async (placa) => {
    if (process.env.DEMO_NOVA_MULTA !== 'true') return [];
    return [{
      ait: 'D' + String(Math.abs(hash(placa)) % 90000000 + 10000000),
      orgao: 'DETRAN-SP (demonstração)',
      enquadramento: '7455-0',
      descricao: 'Excesso de velocidade até 20% (detecção simulada)',
      valor: 130.16, pontos: 4, origem: 'radar',
      data_infracao: hoje(-3), data_notificacao: hoje(0), prazo_defesa: hoje(27)
    }];
  },
  /** PLUG: integração Detran mediante convênio — implementar consulta oficial aqui. */
  detran: async () => [],
  /** PLUG: SNE/Senatran mediante adesão — implementar aqui. */
  sne: async () => []
};
function hash(s){ let h=0; for(const c of s) h=(h*31 + c.charCodeAt(0))|0; return h; }
const { dataLocal } = require('./datas');
function hoje(mais){ return dataLocal(mais); }   // dia civil do Brasil, não do servidor em UTC

/** Varre todas as placas cadastradas em todas as fontes ativas. */
async function varrerPlacas() {
  const fontesAtivas = (process.env.FONTES_MONITORAMENTO || 'demo').split(',').map(f=>f.trim()).filter(f=>FONTES[f]);
  const veiculos = db.prepare(`SELECT v.id, v.placa, v.usuario_id, u.nome, u.email
    FROM veiculos v JOIN usuarios u ON u.id = v.usuario_id`).all();
  let novas = 0;
  for (const v of veiculos) {
    for (const fonte of fontesAtivas) {
      let achadas = [];
      try { achadas = await FONTES[fonte](v.placa); } catch (e) { continue; }
      for (const m of achadas) {
        // dedup: mesma AIT para o mesmo usuário nunca entra duas vezes
        const existe = db.prepare('SELECT 1 FROM multas WHERE ait=? AND usuario_id=?').get(m.ait, v.usuario_id);
        if (existe) continue;
        const dados = { origem: m.origem, tem_foto: false, observacao: '', campos_faltantes: [],
          data_infracao: m.data_infracao, data_notificacao: m.data_notificacao };
        db.prepare(`INSERT INTO multas (usuario_id,veiculo_id,ait,orgao,enquadramento,descricao,valor,pontos,
          data_infracao,data_notificacao,prazo_defesa,origem,dados_json,detectada_por)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(v.usuario_id, v.id, m.ait, m.orgao, m.enquadramento, m.descricao, m.valor, m.pontos,
            m.data_infracao, m.data_notificacao, m.prazo_defesa, m.origem, JSON.stringify(dados), fonte);
        novas++;
        await emails.enviar('nova_multa',
          { id: v.usuario_id, nome: v.nome, email: v.email },
          { placa: v.placa, ait: m.ait, descricao: m.descricao, valor: m.valor,
            prazo: (m.prazo_defesa||'').split('-').reverse().join('/') },
          `nova_multa:${v.usuario_id}:${m.ait}`);
      }
    }
  }
  db.prepare('INSERT INTO varreduras (fonte,placas_verificadas,novas_multas,detalhe) VALUES (?,?,?,?)')
    .run(fontesAtivas.join(','), veiculos.length, novas, novas ? 'alertas disparados' : 'nada novo');
  return { fontes: fontesAtivas, placas_verificadas: veiculos.length, novas_multas: novas };
}

module.exports = { varrerPlacas };
