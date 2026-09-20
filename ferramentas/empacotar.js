/**
 * VERIMULTA — monta o ZIP de instalação no Desktop.
 *
 *   npm run zip
 *
 * O conteúdo é o mesmo de `npm run pasta` (ver pacote.js): sistema, site,
 * manuais e os atalhos de 1 clique. O `npm install` roda na máquina de destino
 * pelo 1-INSTALAR.cmd — empacotar `node_modules` deixaria o ZIP enorme e com
 * binário compilado para a máquina errada.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { montar } = require('./pacote');

const hoje = new Date().toISOString().slice(0, 10);
const NOME = `VERIMULTA_INSTALAR_${hoje}`;
const PALCO = path.join(os.tmpdir(), NOME);
const DESKTOP = path.join(process.env.USERPROFILE || os.homedir(), 'Desktop');
const ZIP = path.join(DESKTOP, `${NOME}.zip`);

console.log(`\nMontando ${NOME}\n`);
fs.rmSync(PALCO, { recursive: true, force: true });
const c = montar(PALCO);
console.log(`  sistema/   ${c.sistema} arquivos`);
console.log(`  site/      ${c.site} arquivos`);
console.log(`  manuais/   ${c.manuais} arquivos`);
console.log('  atalhos    1-INSTALAR · 2-CONFIGURAR · 3-INICIAR · 4-PAINEL-DO-DONO · PARAR');

fs.rmSync(ZIP, { force: true });
execFileSync('powershell', ['-NoProfile', '-Command',
  `Compress-Archive -Path '${PALCO}\\*' -DestinationPath '${ZIP}' -CompressionLevel Optimal`],
  { stdio: 'inherit' });
fs.rmSync(PALCO, { recursive: true, force: true });

console.log(`\n=== ${ZIP}  ·  ${(fs.statSync(ZIP).size / 1024).toFixed(0)} KB ===\n`);
