/**
 * VERIMULTA — bateria de verificação (sem dependências nativas).
 * Cobre o motor de auditoria, o extrator de OCR, a consistência da tabela de
 * planos (regressão do bug de checkout) e a exigência de segredos.
 *   node teste.js
 */
const fs = require('fs');
const { auditar, jurimetria } = require('./motor_auditoria');
const { extrairCampos } = require('./ocr');

let falhas = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FALHA ') + m); if (!c) falhas++; };

console.log('\n[1] Caso do README: AIT T00226588 — agente, sem foto → 30%, vício A12');
const v = auditar({ origem: 'agente', tem_foto: false, campos_faltantes: [], observacao: '' });
const j = jurimetria(v);
ok(j.probabilidade === 30, `probabilidade = ${j.probabilidade} (esperado 30)`);
ok(j.teses.length === 1 && j.teses[0].codigo === 'A12', `única tese = ${j.teses.map(t => t.codigo)}`);

console.log('\n[2] A4–A8 não se aplicam quando origem = agente');
ok(v.filter(x => ['A4', 'A5', 'A6', 'A7', 'A8'].includes(x.codigo)).every(x => x.aplicavel === false),
   'A4–A8 marcadas como não aplicáveis');

console.log('\n[3] Composição da jurimetria com vários vícios (radar problemático)');
const j2 = jurimetria(auditar({
  origem: 'radar', tem_foto: true, campos_faltantes: ['local'], observacao: 'observação longa o suficiente',
  afericao_validade: false, homologacao_ok: false, estudo_tecnico_ok: false,
  sinalizacao_ok: false, coordenadas_ok: false
}));
console.log(`         vícios=${j2.teses.length}  probabilidade=${j2.probabilidade}%  faixa=${j2.faixa}`);
ok(j2.probabilidade <= 85, `probabilidade respeita o teto de 85% (veio ${j2.probabilidade}%)`);
ok(j2.teto_aplicado === true, 'teto sinalizado quando a conta bruta passa de 85%');
ok(j2.nota_correlacao.length > 0, 'nota de correlação presente (teses do mesmo radar contam uma vez)');
ok(j2.indice === 'POSSÍVEL INCONSISTÊNCIA', `índice de consistência = ${j2.indice}`);

console.log('\n[4] A3 — prazo de notificação');
ok(auditar({ origem: 'agente', data_infracao: '2026-01-01', data_notificacao: '2026-03-01', campos_faltantes: [] })
   .find(x => x.codigo === 'A3').vicio === true, 'acusa atraso de 59 dias');
const a3neg = auditar({ origem: 'agente', data_infracao: '2026-03-01', data_notificacao: '2026-01-01', campos_faltantes: [] })
   .find(x => x.codigo === 'A3');
ok(a3neg.vicio === true, 'notificação ANTERIOR à infração é acusada como inconsistência');
ok(/ANTERIOR/.test(a3neg.detalhe), 'detalhe explica a inversão de datas');

console.log('\n[5] OCR — extrator de campos sobre notificação sintética');
const doc = `PREFEITURA MUNICIPAL
AUTO DE INFRACAO N T00226588
PLACA ABC1D23
DATA   HORA
15/01/2026 14:32
DATA DA NOTIFICACAO 20/01/2026
DEFESA PREVIA ate 20/02/2026
CODIGO DA INFRACAO  DESDOBRAMENTO
7455 0
Valor R$ 130,16`;
const c = extrairCampos(doc);
ok(c.ait === 'T00226588', `ait = ${c.ait}`);
ok(c.placa === 'ABC1D23', `placa = ${c.placa}`);
ok(c.valor === 130.16, `valor = ${c.valor}`);
ok(c.data_infracao === '2026-01-15', `data_infracao = ${c.data_infracao}`);
ok(c.enquadramento === '7455-0', `enquadramento = ${c.enquadramento}`);
console.log(`         confiança=${c.confianca}%  faltantes=[${c.campos_faltantes}]`);

console.log('\n[6] Tabela de planos — regressão do bug de checkout');
const P = require('./planos');
const botoes = [...new Set([...fs.readFileSync('./publico/app.html', 'utf8')
  .matchAll(/assinar\('([a-z_0-9]+)'/g)].map(m => m[1]))];
console.log('  PLANOS :', Object.keys(P.PLANOS).join(', '));
console.log('  PRECOS :', Object.entries(P.PRECOS).map(([k, val]) => `${k}=${val}`).join(', '));
console.log('  botões :', botoes.join(', '));
const rejeitados = botoes.filter(p => P.PRECOS[p] === undefined);
const orfaos = Object.keys(P.PRECOS).filter(p => !P.PLANOS[p]);
ok(rejeitados.length === 0, `botões que o /v1/checkout rejeitaria: [${rejeitados.join(', ')}]`);
ok(orfaos.length === 0, `preços sem plano correspondente: [${orfaos.join(', ')}]`);
ok(P.PRECOS.combo1 === 29.90 && P.PRECOS.combo2 === 39.90 && P.PRECOS.combo3 === 49.90,
   'grade oficial do manual (combo1 29,90 · combo2 39,90 · combo3 49,90)');
ok(P.PRECOS.empresa_start === 89.90 && P.PRECOS.empresa_pro === 149.90, 'planos PJ preservados');
ok(P.PRECOS.gratis === undefined && P.PRECOS.frota === undefined, 'grátis e frota fora do checkout de valor fixo');
ok(P.planoDe('xpto').nome === 'Grátis', 'plano desconhecido cai no grátis em vez de estourar');
ok(P.planoDe('individual').nome === 'Combo 01' && P.precoDe('casal') === 49.90,
   'assinante da grade antiga não é rebaixado (alias individual→combo1, casal→combo3)');

console.log('\n[7] pagamentos.js lê a fonte única');
const pg = fs.readFileSync('./pagamentos.js', 'utf8');
ok(/require\('\.\/planos'\)/.test(pg), 'importa ./planos');
ok(!/const PRECOS = \{/.test(pg), 'não declara mais uma tabela PRECOS própria');

console.log('\n[8] Segredos');
const src = fs.readFileSync('./servidor.js', 'utf8') + pg;
ok(!/trocar-em-producao|defina-admin-secret|demo-webhook-secret/.test(src),
   'nenhum segredo padrão previsível restou no código');
const cfg = require('./config');
ok(cfg.JWT_SECRET && cfg.JWT_SECRET.length >= 40, `JWT_SECRET aleatório gerado em dev (${cfg.JWT_SECRET.length} chars)`);
ok(cfg.conferirSegredo('abc', 'abc') === true
   && cfg.conferirSegredo('abc', 'abd') === false
   && cfg.conferirSegredo('', 'abc') === false, 'conferirSegredo() compara corretamente');

console.log('\n[9] Datas — prazo é dia de calendário, não instante');
const D = require('./datas');
ok(/^\d{4}-\d{2}-\d{2}$/.test(D.hoje()), `hoje() = ${D.hoje()} (AAAA-MM-DD)`);
ok(D.diasAte(D.dataLocal(7)) === 7, 'diasAte(+7 dias) = 7');
ok(D.diasAte(D.dataLocal(1)) === 1, 'diasAte(amanhã) = 1 — a tela não pode dizer 0 com 1 dia restando');
ok(D.diasAte(D.hoje()) === 0, 'diasAte(hoje) = 0');
ok(D.diasAte(D.dataLocal(-3)) === -3, 'prazo vencido devolve negativo');
ok(D.diasAte(null) === null && D.diasAte('lixo') === null, 'data ausente ou inválida devolve null, nunca NaN');

// O bug que motivou este módulo: às 21h30 no Brasil o servidor (UTC) já está no
// dia seguinte, e o alerta de 7 dias passava a procurar o 8º dia — ninguém era avisado.
const noite = new Date('2026-06-10T21:30:00-03:00').getTime();
const tarde = new Date('2026-06-10T14:00:00-03:00').getTime();
ok(D.dataLocal(7, noite) === D.dataLocal(7, tarde),
   `alvo do alerta é o mesmo às 14h e às 21h30 (${D.dataLocal(7, noite)})`);
ok(D.dataLocal(7, tarde) === '2026-06-17', 'e é o dia certo: 10/06 + 7 = 17/06');
ok(D.dataLocal(0, noite) === '2026-06-10', 'às 21h30 do dia 10, "hoje" ainda é 10 (não 11)');
ok(D.paraBR('2026-06-17') === '17/06/2026', 'paraBR formata para o leitor brasileiro');
ok(D.carimboLocal('2026-09-20 23:29:10').startsWith('20/09/2026'),
   `carimbo UTC do banco vira hora de Brasília (${D.carimboLocal('2026-09-20 23:29:10')})`);

console.log('\n[10] O app e o e-mail contam os dias do mesmo jeito');
const appHtml = fs.readFileSync('./publico/app.html', 'utf8');
ok(/function diasAte/.test(appHtml) && /Date\.UTC\(p\[0\]/.test(appHtml),
   'app.html usa dia civil local no contador de prazo');
ok(!/Math\.round\(\(new Date\(comPrazo\.prazo_defesa\)-Date\.now\(\)\)/.test(appHtml),
   'a conta antiga por instante (que dava um dia a menos) não voltou');
ok(/require\('\.\/datas'\)/.test(fs.readFileSync('./emails.js', 'utf8')), 'emails.js usa o módulo de datas');
ok(/require\('\.\/datas'\)/.test(fs.readFileSync('./monitor.js', 'utf8')), 'monitor.js usa o módulo de datas');
ok(/Intl\.DateTimeFormat/.test(fs.readFileSync('./publico/admin.html', 'utf8')),
   'admin.html converte o carimbo UTC do banco para a hora local');

console.log(`\n=== ${falhas} falha(s) ===`);
process.exit(falhas ? 1 : 0);
