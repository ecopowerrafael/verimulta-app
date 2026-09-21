/**
 * VERIMULTA — fonte de demonstração.
 *
 * Existe para exercitar o caminho completo (fonte » monitor » alerta » tela)
 * sem depender de contrato. Fica DESLIGADA por padrão e só acende com
 * `DEMO_NOVA_MULTA=true`, que é proibido em produção.
 *
 * Todo registro que sai daqui vem carimbado com `demonstracao: true` e o AIT
 * começa com "DEMO-". A regra da casa é não inventar multa; aqui a invenção é
 * assumida, rotulada e impossível de confundir com dado real.
 */
const nome = 'demonstracao';
const rotulo = 'Demonstração (dados fictícios, rotulados)';
const oficial = false;
const fornece = ['multas'];

function ativa() {
  return process.env.DEMO_NOVA_MULTA === 'true' && process.env.NODE_ENV !== 'production';
}
function motivo() {
  return process.env.NODE_ENV === 'production'
    ? 'Bloqueada em produção — nunca inventar multa.'
    : 'Desligada. Ligue com DEMO_NOVA_MULTA=true apenas para testar o fluxo.';
}

function digito(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

async function consultar(p = {}) {
  if (!ativa()) return { ok: false, erro: 'desligada' };
  const { dataLocal } = require('../datas');
  return {
    ok: true,
    dados: [{
      demonstracao: true,
      ait: 'DEMO-' + (digito(p.placa || 'x') % 90000000 + 10000000),
      orgao: 'ÓRGÃO DE DEMONSTRAÇÃO',
      enquadramento: '7455-0',
      descricao: 'Excesso de velocidade até 20% (registro fictício de demonstração)',
      valor: 130.16, pontos: 4, origem: 'radar',
      data_infracao: dataLocal(-3),
      data_notificacao: dataLocal(0),
      prazo_defesa: dataLocal(27)
    }]
  };
}

module.exports = { nome, rotulo, oficial, fornece, ativa, motivo, consultar };
