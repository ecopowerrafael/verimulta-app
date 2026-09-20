/**
 * VERIMULTA — gera site-netlify/ a partir de sistema/publico/.
 *
 * As duas pastas eram cópias manuais uma da outra. Bastou mudar a grade de
 * planos num lado para o site publicado passar a vender um plano que o
 * checkout recusa. A partir daqui, site-netlify/ é DERIVADO: rode este script
 * depois de qualquer alteração em sistema/publico/.
 *
 *   node sincronizar-netlify.js            # sincroniza
 *   node sincronizar-netlify.js --conferir # só verifica (sai 1 se divergiu)
 */
const fs = require('fs');
const path = require('path');

const ORIGEM = path.join(__dirname, 'sistema', 'publico');
const DESTINO = path.join(__dirname, 'site-netlify');

/** Arquivos que existem só no Netlify e NÃO podem ser apagados na sincronização. */
const EXCLUSIVOS_DO_NETLIFY = ['.htaccess', 'LEIA-ME-INSTALACAO.html', 'social.png'];

const conferir = process.argv.includes('--conferir');
let divergencias = 0;

function listar(dir, prefixo = '') {
  const saida = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefixo, item.name);
    if (item.isDirectory()) saida.push(...listar(path.join(dir, item.name), rel));
    else saida.push(rel);
  }
  return saida;
}

/** Normaliza quebras de linha nos textos: o Netlify serve LF. */
function ler(arquivo) {
  const bruto = fs.readFileSync(arquivo);
  const texto = /\.(html|js|json|txt|css|svg)$/i.test(arquivo);
  return texto ? Buffer.from(bruto.toString('utf8').replace(/\r\n/g, '\n'), 'utf8') : bruto;
}

for (const rel of listar(ORIGEM)) {
  const de = path.join(ORIGEM, rel);
  const para = path.join(DESTINO, rel);
  const conteudo = ler(de);
  const atual = fs.existsSync(para) ? fs.readFileSync(para) : null;

  if (atual && atual.equals(conteudo)) continue;
  divergencias++;
  if (conferir) { console.log(`  divergente: ${rel}`); continue; }
  fs.mkdirSync(path.dirname(para), { recursive: true });
  fs.writeFileSync(para, conteudo);
  console.log(`  ${atual ? 'atualizado' : 'criado'}: ${rel}`);
}

const preservados = EXCLUSIVOS_DO_NETLIFY.filter(f => fs.existsSync(path.join(DESTINO, f)));
console.log(`\nExclusivos do Netlify preservados: ${preservados.join(', ') || '(nenhum)'}`);

if (conferir) {
  console.log(divergencias
    ? `\n=== ${divergencias} arquivo(s) fora de sincronia — rode: node sincronizar-netlify.js ===`
    : '\n=== site-netlify/ em dia com sistema/publico/ ===');
  process.exit(divergencias ? 1 : 0);
}
console.log(`\n=== ${divergencias} arquivo(s) sincronizado(s) ===`);
