/**
 * VERIMULTA — monta o ZIP de instalação no Desktop.
 *
 *   npm run zip
 *
 * O pacote leva só o que é preciso para rodar e publicar: o sistema (sem
 * node_modules e sem banco), o site estático e os três manuais. O `npm install`
 * baixa as dependências na hora — empacotá-las deixaria o ZIP enorme e com
 * binário compilado para a máquina errada.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const SISTEMA = path.join(RAIZ, '6_CODIGO_FONTE', 'sistema');
const NETLIFY = path.join(RAIZ, '6_CODIGO_FONTE', 'site-netlify');
const MANUAIS = path.join(RAIZ, '3_DOCUMENTACAO_PROJETO', 'manuais');
const DESKTOP = path.join(process.env.USERPROFILE || require('os').homedir(), 'Desktop');

const hoje = new Date().toISOString().slice(0, 10);
const NOME = `VERIMULTA_INSTALAR_${hoje}`;
const PALCO = path.join(require('os').tmpdir(), NOME);
const ZIP = path.join(DESKTOP, `${NOME}.zip`);

/** Nunca entram no pacote: pesados, gerados ou com dado de execução. */
const EXCLUIR = [/^node_modules$/, /^\.git$/, /\.db(-wal|-shm)?$/, /^\.env/, /\.log$/];
const excluido = (nome) => EXCLUIR.some(rx => rx.test(nome));

function copiar(de, para) {
  fs.mkdirSync(para, { recursive: true });
  let arquivos = 0;
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    if (excluido(item.name)) continue;
    const origem = path.join(de, item.name);
    const destino = path.join(para, item.name);
    if (item.isDirectory()) arquivos += copiar(origem, destino);
    else { fs.copyFileSync(origem, destino); arquivos++; }
  }
  return arquivos;
}

const COMECE = `VERIMULTA — COMECE AQUI
=======================================================================
PRIMECORP BROKERS — CONSULTORIA E INTERMEDIACAO DE NEGOCIOS LTDA
CNPJ 55.745.297/0001-06 · pacote gerado em ${hoje}


O QUE TEM NESTE PACOTE
-----------------------------------------------------------------------
  sistema/    o Verimulta inteiro: site, app, API, painel do dono,
              motor de auditoria, pagamentos, e-mails e os testes
  site/       a vitrine estatica (opcional, para o Netlify)
  manuais/    Guia de Ativacao (leia este), Handoff do Desenvolvedor
              e Cronograma Go-Live


PARA VER O SISTEMA RODANDO NO SEU PC — 15 MINUTOS
-----------------------------------------------------------------------
  1. Instale o Node.js: nodejs.org > versao LTS > Avancar ate o fim.

  2. Abra a pasta "sistema" no Explorer, clique na barra de endereco
     (onde aparece o caminho), digite  powershell  e tecle Enter.

  3. Digite:   npm install
     Aguarde terminar. So precisa na primeira vez.

  4. Digite:   npm test
     Tem de aparecer "0 falha(s)" duas vezes. Sao 72 verificacoes
     automaticas. Se alguma falhar, NAO suba o sistema: me chame.

  5. Digite:   $env:ADMIN_SECRET="MinhaChave2026"; node servidor.js
     Vai aparecer "Verimulta API no ar".

  6. No Chrome:
       http://localhost:3000/app.html     <- o aplicativo
       http://localhost:3000/admin.html   <- o Painel do Dono
                                             (entre com MinhaChave2026)

     Crie uma conta, escaneie a multa-exemplo, assine no modo
     demonstracao e gere a defesa em PDF. Tudo funcionando aqui
     significa que esta pronto para ir para a internet.

  7. Para desligar: Ctrl+C no PowerShell.


IMPORTANTE ENQUANTO VOCE TESTA
-----------------------------------------------------------------------
  * Rodando assim, no seu PC, o sistema esta em MODO DEMONSTRACAO:
    ninguem e cobrado de verdade e nenhum e-mail sai. E o modo certo
    para testar a vontade.

  * O banco de dados fica no arquivo verimulta.db, dentro da pasta
    sistema. Apagou o arquivo, zerou os testes. E normal.

  * Para colocar no ar de verdade e comecar a receber, siga o
    manuais/Verimulta_Guia_de_Ativacao.pdf — ele leva do GitHub ao
    primeiro pagamento, com a lista de todas as chaves a preencher.


A REGRA DA CASA
-----------------------------------------------------------------------
  Nunca prometer cancelamento da multa. Nunca inventar multa.
  A estimativa e sempre estimativa: quem decide e o orgao julgador.

Chegou quem verifica.
`;

console.log(`\nMontando ${NOME}\n`);
fs.rmSync(PALCO, { recursive: true, force: true });
fs.mkdirSync(PALCO, { recursive: true });

const n1 = copiar(SISTEMA, path.join(PALCO, 'sistema'));
console.log(`  sistema/   ${n1} arquivos`);
const n2 = copiar(NETLIFY, path.join(PALCO, 'site'));
console.log(`  site/      ${n2} arquivos`);
const n3 = copiar(MANUAIS, path.join(PALCO, 'manuais'));
console.log(`  manuais/   ${n3} arquivos`);

// A auditoria do codigo vai junto: o pacote nao esconde o que esta em aberto.
fs.copyFileSync(path.join(RAIZ, '6_CODIGO_FONTE', 'AUDITORIA.md'),
                path.join(PALCO, 'manuais', 'AUDITORIA-DO-CODIGO.md'));

// BOM no .txt para o Bloco de Notas do Windows mostrar os acentos certos.
fs.writeFileSync(path.join(PALCO, 'COMECE-AQUI.txt'), '﻿' + COMECE, 'utf8');

fs.rmSync(ZIP, { force: true });
execFileSync('powershell', ['-NoProfile', '-Command',
  `Compress-Archive -Path '${PALCO}\\*' -DestinationPath '${ZIP}' -CompressionLevel Optimal`],
  { stdio: 'inherit' });
fs.rmSync(PALCO, { recursive: true, force: true });

const kb = (fs.statSync(ZIP).size / 1024).toFixed(0);
console.log(`\n=== ${ZIP}  ·  ${kb} KB ===\n`);
