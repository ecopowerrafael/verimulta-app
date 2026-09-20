/**
 * VERIMULTA — conferência dos manuais contra o sistema.
 *
 * Foi exatamente esta checagem que faltou: os manuais mandavam cadastrar um
 * webhook que respondia 404 e vender um plano que o checkout recusava, e nada
 * no projeto apontava a contradição. Agora aponta.
 *
 *   node conferir.js     (sai 1 se algum fato do manual não bater com o código)
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SISTEMA = path.join(RAIZ, '6_CODIGO_FONTE', 'sistema');
const ler = (...p) => fs.readFileSync(path.join(...p), 'utf8');

const manuais = ler(__dirname, 'documentos.js');
const servidor = ler(SISTEMA, 'servidor.js');
const renderYaml = ler(SISTEMA, 'render.yaml');
const planos = require(path.join(SISTEMA, 'planos.js'));

let problemas = 0;
const falhar = (msg) => { console.log(`  FALHA ${msg}`); problemas++; };
const passar = (msg) => console.log(`  PASS  ${msg}`);

// ---------------------------------------------------------------- rotas
console.log('\n[1] Rotas citadas nos manuais existem no servidor');
const rotasDeclaradas = new Set();
for (const m of servidor.matchAll(/app\.(get|post|delete|put)\(\s*'([^']+)'/g)) {
  rotasDeclaradas.add(m[2]);
}
// Todo caminho /v1/... citado nos manuais, em qualquer contexto: entre crases,
// dentro de uma URL completa ou solto na prosa.
const citadas = new Set();
for (const m of manuais.matchAll(/\/v1\/[A-Za-z0-9_:/.\-]*[A-Za-z0-9_*]/g)) {
  citadas.add(m[0].replace(/[.,)]+$/, ''));
}
/**
 * A rota citada casa com uma declarada, tolerando o nome do parâmetro (:id).
 * `/v1/admin/*` é a notação de família usada no manual: basta existir alguma
 * rota declarada sob aquele prefixo.
 */
const casa = (citada) => {
  if (citada.endsWith('*')) {
    const prefixo = citada.slice(0, -1);
    return [...rotasDeclaradas].some(decl => decl.startsWith(prefixo));
  }
  return [...rotasDeclaradas].some(decl => {
    const rx = new RegExp('^' + decl.replace(/:[A-Za-z0-9_]+/g, '[^/]+').replace(/\//g, '\\/') + '$');
    return rx.test(citada.replace(/:[A-Za-z0-9_]+/g, 'X'));
  });
};
for (const rota of [...citadas].sort()) {
  if (casa(rota)) passar(`${rota} existe`);
  else falhar(`${rota} é citada nos manuais e NÃO existe em servidor.js`);
}

// ---------------------------------------------------------------- planos
console.log('\n[2] Planos e preços citados batem com planos.js');
const precosCitados = new Map();
// "`combo1` · **R$ 29,90**"  /  "**Combo 01 (R$ 29,90)**"
for (const m of manuais.matchAll(/`(combo\d|empresa_\w+|frota)`[^\n]{0,40}?R\$\s?([\d.]+,\d{2})/g)) {
  precosCitados.set(m[1], parseFloat(m[2].replace(/\./g, '').replace(',', '.')));
}
for (const [chave, valor] of precosCitados) {
  const real = planos.PRECOS[chave];
  if (real === undefined && chave === 'frota') { passar('frota sem preço fixo (sob proposta), como o código'); continue; }
  if (real === valor) passar(`${chave} = R$ ${valor.toFixed(2)} confere`);
  else falhar(`${chave}: manual diz R$ ${valor.toFixed(2)}, planos.js diz ${real === undefined ? '(não existe)' : 'R$ ' + real.toFixed(2)}`);
}
if (!precosCitados.size) falhar('nenhum preço encontrado nos manuais — o extrator ou o texto mudou');

// o manual não pode citar um plano que o checkout recusa
for (const m of manuais.matchAll(/Combo 0(\d)/g)) {
  const chave = 'combo' + m[1];
  if (planos.PRECOS[chave] === undefined) falhar(`manual vende "Combo 0${m[1]}" e o checkout não conhece \`${chave}\``);
}
if (!problemas) passar('nenhum plano vendido no manual é desconhecido pelo checkout');

// ---------------------------------------------------------------- variáveis
console.log('\n[3] Variáveis de ambiente citadas são lidas pelo código');
const fontes = ['servidor.js', 'pagamentos.js', 'emails.js', 'ocr.js', 'monitor.js', 'banco.js',
  'config.js', 'seguranca.js', 'planos.js', 'pdf.js']
  .map(f => ler(SISTEMA, f)).join('\n') + renderYaml;
const IGNORAR = new Set(['DEMO_NOVA_MULTA']);   // citada só para dizer "nunca use"
const varsCitadas = new Set();
for (const m of manuais.matchAll(/`([A-Z][A-Z0-9_]{3,})`/g)) varsCitadas.add(m[1]);
for (const v of [...varsCitadas].sort()) {
  if (IGNORAR.has(v)) continue;
  if (fontes.includes(v)) passar(`${v} é lida pelo código ou declarada no render.yaml`);
  else falhar(`${v} aparece nos manuais e NÃO existe no código nem no render.yaml`);
}

// ---------------------------------------------------------------- teto
console.log('\n[4] Afirmações numéricas do manual');
const motor = ler(SISTEMA, 'motor_auditoria.js');
const teto = motor.match(/const TETO = ([\d.]+)/);
if (teto && Math.round(parseFloat(teto[1]) * 100) === 85) passar('teto de 85% citado nos manuais confere com motor_auditoria.js');
else falhar(`manuais citam teto de 85%, motor_auditoria.js diz ${teto ? teto[1] : '(não encontrado)'}`);

const dbPath = /\/var\/data\/verimulta\.db/.test(renderYaml);
dbPath ? passar('render.yaml usa o disco persistente que os manuais mandam conferir')
       : falhar('manuais falam em disco persistente em /var/data e o render.yaml não o declara');

console.log(`\n=== ${problemas} divergência(s) entre os manuais e o sistema ===`);
process.exit(problemas ? 1 : 0);
