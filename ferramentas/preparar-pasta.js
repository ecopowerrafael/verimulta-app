/**
 * VERIMULTA — deixa a pasta de trabalho pronta em Documentos.
 *
 *   npm run pasta
 *
 * Diferença para o ZIP: aqui o `npm install` já roda e os testes já passam,
 * então a pasta fica pronta para usar — sobra clicar em 2-CONFIGURAR e
 * 3-INICIAR. Regerar é seguro: o `.env` e o banco `verimulta.db` existentes
 * são preservados, porque são o que guarda a sua chave e os seus testes.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { montar } = require('./pacote');

const DESTINO = process.argv[2] ||
  path.join(process.env.USERPROFILE || os.homedir(), 'Documents', 'VERIMULTA');
const SISTEMA = path.join(DESTINO, 'sistema');

/** O que é do computador dele, não do pacote: nunca sobrescrever. */
const PRESERVAR = ['.env', 'verimulta.db', 'verimulta.db-wal', 'verimulta.db-shm'];
const COFRE = path.join(os.tmpdir(), 'verimulta-preservar-' + Date.now());

console.log(`\nPreparando ${DESTINO}\n`);

const guardados = [];
if (fs.existsSync(SISTEMA)) {
  fs.mkdirSync(COFRE, { recursive: true });
  for (const nome of PRESERVAR) {
    const de = path.join(SISTEMA, nome);
    if (fs.existsSync(de)) { fs.copyFileSync(de, path.join(COFRE, nome)); guardados.push(nome); }
  }
  if (guardados.length) console.log(`  preservando: ${guardados.join(', ')}`);
}

const c = montar(DESTINO);
console.log(`  sistema/   ${c.sistema} arquivos`);
console.log(`  site/      ${c.site} arquivos`);
console.log(`  manuais/   ${c.manuais} arquivos`);
console.log('  atalhos    1-INSTALAR · 2-CONFIGURAR · 3-INICIAR · 4-PAINEL-DO-DONO · PARAR');

for (const nome of guardados) fs.copyFileSync(path.join(COFRE, nome), path.join(SISTEMA, nome));
fs.rmSync(COFRE, { recursive: true, force: true });

// O npm no Windows é um .cmd, que o Node 24 recusa executar sem shell. Como o
// comando é literal (nada vem de fora), execSync com a linha pronta resolve
// sem o aviso de depreciação que `args + shell:true` provoca.
console.log('\n  Instalando as dependencias...');
execSync('npm install --no-audit --no-fund', { cwd: SISTEMA, stdio: ['ignore', 'ignore', 'inherit'] });

console.log('  Rodando as verificacoes...');
try {
  execSync('npm test', { cwd: SISTEMA, stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('  Testes: 0 falhas.');
} catch (e) {
  console.error('\n  ATENCAO: alguma verificacao falhou. Rode `npm test` em ' + SISTEMA);
  process.exit(1);
}

console.log(`\n=== Pronto: ${DESTINO} ===`);
console.log('    Abra a pasta e clique em 2-CONFIGURAR.cmd, depois 3-INICIAR.cmd\n');
