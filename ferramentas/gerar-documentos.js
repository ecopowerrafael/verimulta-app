/**
 * VERIMULTA — gera os manuais operacionais em PDF.
 *
 *   npm run docs        (gera)
 *   npm run conferir    (só confere os fatos contra o código)
 *
 * Saída: 3_DOCUMENTACAO_PROJETO/manuais/
 */
const path = require('path');
const docs = require('./documentos');
const { caracteresPerdidos, avisosDeMarcacao } = require('./deck');

const DESTINO = path.join(__dirname, '..', '3_DOCUMENTACAO_PROJETO', 'manuais');

const LISTA = [
  ['Verimulta_Guia_de_Ativacao.pdf', docs.guiaDeAtivacao],
  ['Verimulta_Handoff_Desenvolvedor.pdf', docs.handoffDesenvolvedor],
  ['Verimulta_Cronograma_GoLive.pdf', docs.cronogramaGoLive],
  ['Verimulta_Termo_do_Beta.pdf', docs.termoBeta],
  ['Verimulta_Roteiro_do_Beta.pdf', docs.roteiroBeta]
];

/**
 * Manuais que deixaram de existir: os três explicavam o MESMO caminho para
 * leitores diferentes e foi assim que divergiram entre si e do código.
 * Agora são um só — e o arquivo antigo é apagado para ninguém seguir a versão
 * velha por engano.
 */
const APOSENTADOS = [
  'Verimulta_Plano_de_Ativacao.pdf',
  'Verimulta_Manual_Instalacao.pdf',
  'Verimulta_Do_Zero_Ao_Ar.pdf'
];

(async () => {
  console.log('\nGerando os manuais do Verimulta\n');
  let paginas = 0, transbordos = 0;
  for (const [nome, gerar] of LISTA) {
    const r = await gerar(path.join(DESTINO, nome));
    paginas += r.paginas;
    const aviso = r.transbordos.length ? `  << TRANSBORDOU: ${[...new Set(r.transbordos)].join(' | ')}` : '';
    if (r.transbordos.length) transbordos += r.transbordos.length;
    console.log(`  ${nome.padEnd(38)} ${String(r.paginas).padStart(2)} págs · ${(r.bytes / 1024).toFixed(0)} KB${aviso}`);
  }
  const fs = require('fs');
  for (const velho of APOSENTADOS) {
    const caminho = path.join(DESTINO, velho);
    if (fs.existsSync(caminho)) { fs.unlinkSync(caminho); console.log(`  (removido: ${velho} — consolidado no Guia de Ativação)`); }
  }

  const aninhados = avisosDeMarcacao();
  if (aninhados.length) {
    console.log('\n  ATENÇÃO: marcação aninhada (sairia com as crases à mostra):');
    aninhados.forEach(t => console.log(`    ${t}`));
    transbordos += aninhados.length;
  }
  const perdidos = caracteresPerdidos();
  if (perdidos.length) {
    console.log(`\n  ATENÇÃO: caracteres descartados por não existirem na fonte: ${perdidos.join(' ')}`);
    console.log('  Mapeie-os em SUBSTITUICOES (deck.js) para não sumirem do texto.');
  }
  console.log(`\n=== ${LISTA.length} documentos · ${paginas} páginas · ${DESTINO} ===\n`);
  if (transbordos) {
    console.error(`FALHA: ${transbordos} slide(s) com conteúdo além da página — o texto sai cortado `
      + 'e a numeração do rodapé fica errada. Encurte o texto ou reduza o corpo.');
    process.exit(1);
  }
})().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
