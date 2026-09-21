/**
 * VERIMULTA — monta o conteúdo do pacote pronto para uso.
 *
 * Usado por `empacotar.js` (gera o ZIP) e por `preparar-pasta.js` (deixa a
 * pasta pronta e instalada). O conteúdo é o mesmo nos dois, então o atalho que
 * funciona na pasta funciona igual em quem receber o ZIP.
 *
 * Os .cmd são escritos SEM acento de propósito: o console do Windows usa
 * code page 850 por padrão e acento vira caractere quebrado na tela.
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SISTEMA = path.join(RAIZ, '6_CODIGO_FONTE', 'sistema');
const NETLIFY = path.join(RAIZ, '6_CODIGO_FONTE', 'site-netlify');
const MANUAIS = path.join(RAIZ, '3_DOCUMENTACAO_PROJETO', 'manuais');
const AUDITORIA = path.join(RAIZ, '6_CODIGO_FONTE', 'AUDITORIA.md');

/** Nunca entram no pacote: pesados, gerados, ou com dado de execução. */
const EXCLUIR = [/^node_modules$/, /^\.git$/, /\.db(-wal|-shm)?$/, /^\.env$/, /\.log$/,
  /^cloudflared\.exe$/, /^\.cloudflared$/];   // 55 MB: baixado na maquina de destino
const excluido = (nome) => EXCLUIR.some(rx => rx.test(nome));

function copiar(de, para) {
  fs.mkdirSync(para, { recursive: true });
  let n = 0;
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    if (excluido(item.name)) continue;
    const origem = path.join(de, item.name);
    const destino = path.join(para, item.name);
    if (item.isDirectory()) n += copiar(origem, destino);
    else { fs.copyFileSync(origem, destino); n++; }
  }
  return n;
}

// ------------------------------------------------------------------ atalhos
const PUBLICAR = `@echo off
title Verimulta - Publicar na internet (deixe aberto)
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo   Rode antes o 1-INSTALAR.cmd
  pause
  exit /b 1
)
node "%~dp0publicar.js"
pause
`;

const ENDERECOFIXO = `@echo off
title Verimulta - Endereco fixo no seu dominio
cd /d "%~dp0"
node "%~dp0publicar.js" --fixo
pause
`;

const SERVIDOR24H = `@echo off
title Verimulta - Servidor 24h (deixe esta janela aberta)
cd /d "%~dp0sistema"
if not exist "node_modules" goto semdeps
if not exist ".env" goto semconfig
echo.
echo  ============================================================
echo   VERIMULTA - MODO SERVIDOR 24 HORAS
echo  ============================================================
echo.
echo   Diferenca para o 3-INICIAR: nao abre navegador e, se o
echo   servidor cair, ele sobe de novo sozinho em 5 segundos.
echo.
echo   Para o app iniciar junto com o Windows:
echo     1. Aperte Win+R, digite  shell:startup  e Enter
echo     2. Arraste este arquivo para dentro da pasta que abriu
echo        (segurando Alt, para criar um atalho)
echo.
echo   Para PARAR de vez: feche esta janela.
echo.
echo  ============================================================
echo.
:loop
node servidor.js
echo.
echo   [%date% %time%] O servidor parou. Subindo de novo em 5s...
echo   (Se isto repetir sem parar, rode 1-INSTALAR.cmd e veja o erro.)
timeout /t 5 /nobreak >nul
goto loop

:semdeps
echo   Rode primeiro o 1-INSTALAR.cmd
pause
exit /b 1

:semconfig
echo   Rode primeiro o 2-CONFIGURAR.cmd
pause
exit /b 1
`;

const LINKCELULAR = `@echo off
title Verimulta - Link para o celular
cd /d "%~dp0"
echo.
echo  ============================================================
echo   LINK PARA INSTALAR NO CELULAR
echo  ============================================================
echo.
echo   Na MESMA rede wi-fi deste computador, o endereco e:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo        http://%%b:3000/instalar.html
)
echo.
echo   Abra esse endereco no celular (ou leia o QR Code que
echo   aparece na pagina) e siga os passos para Android ou iPhone.
echo.
echo  ------------------------------------------------------------
echo   PARA QUEM ESTA FORA DA SUA REDE
echo  ------------------------------------------------------------
echo   O endereco acima so funciona para quem esta no mesmo
echo   wi-fi. Para os 30 participantes acessarem de casa, o
echo   servidor precisa de um endereco publico na internet:
echo.
echo     - dominio apontado para o seu IP + liberacao da porta
echo       no roteador, OU
echo     - um servico de tunel (Cloudflare Tunnel, ngrok), OU
echo     - hospedar no Render, como explica o Guia de Ativacao.
echo.
echo   Depois de ter o endereco publico, coloque ele em
echo   sistema\\.env na linha URL_BASE - o QR Code passa a
echo   apontar para ele sozinho.
echo.
echo  ============================================================
echo.
start "" http://localhost:3000/instalar.html
pause
`;

const INSTALAR = `@echo off
title Verimulta - Passo 1 - Instalar
cd /d "%~dp0sistema"
echo.
echo  ============================================================
echo   VERIMULTA - PASSO 1 DE 3: INSTALAR
echo  ============================================================
echo.
where node >nul 2>&1
if errorlevel 1 goto semnode
for /f "tokens=*" %%v in ('node -v') do echo   Node.js encontrado: %%v
echo.
echo   [1 de 2] Baixando as dependencias. Pode levar 1 ou 2 minutos...
echo.
call npm install
if errorlevel 1 goto erro
echo.
echo   [2 de 2] Rodando as verificacoes automaticas do sistema...
echo.
call npm test
if errorlevel 1 goto testefalhou
echo.
echo  ============================================================
echo   TUDO CERTO. Agora abra:  2-CONFIGURAR.cmd
echo  ============================================================
echo.
pause
exit /b 0

:semnode
echo   O Node.js ainda nao esta instalado neste computador.
echo.
echo   Vou abrir o site oficial. Baixe a versao LTS e instale
echo   clicando em Avancar ate o fim. Depois feche esta janela
echo   e rode este mesmo arquivo de novo.
echo.
pause
start https://nodejs.org
exit /b 1

:testefalhou
echo.
echo  ============================================================
echo   ATENCAO: alguma verificacao falhou.
echo   NAO coloque o sistema no ar assim. Tire um print desta
echo   janela inteira e mande para o desenvolvedor.
echo  ============================================================
echo.
pause
exit /b 1

:erro
echo.
echo   Falha ao baixar as dependencias. Verifique a internet e
echo   rode este arquivo de novo.
echo.
pause
exit /b 1
`;

const CONFIGURAR = `@echo off
title Verimulta - Passo 2 - Configurar
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo   Rode antes o 1-INSTALAR.cmd
  pause
  exit /b 1
)
node "%~dp0configurar.js"
pause
`;

const INICIAR = `@echo off
title Verimulta - Servidor (nao feche esta janela)
cd /d "%~dp0sistema"
if not exist "node_modules" goto semdeps
if not exist ".env" goto semconfig
echo.
echo  ============================================================
echo   VERIMULTA NO AR
echo  ============================================================
echo.
echo   Aplicativo ....... http://localhost:3000/app.html
echo   Painel do Dono ... http://localhost:3000/admin.html
echo   Site ............. http://localhost:3000/index.html
echo.
echo   Esta janela precisa ficar ABERTA enquanto voce testa.
echo   Para desligar: feche a janela ou aperte Ctrl+C.
echo.
echo  ============================================================
echo.
start "" http://localhost:3000/app.html
node servidor.js
echo.
echo   O servidor parou.
pause
exit /b 0

:semdeps
echo   Ainda falta instalar. Rode primeiro o 1-INSTALAR.cmd
pause
exit /b 1

:semconfig
echo   Ainda falta configurar. Rode primeiro o 2-CONFIGURAR.cmd
pause
exit /b 1
`;

const PAINEL = `@echo off
title Verimulta - Painel do Dono
cd /d "%~dp0"
if not exist "sistema\\.env" goto semconfig
echo.
echo  ============================================================
echo   PAINEL DO DONO
echo  ============================================================
echo.
echo   Sua chave de acesso ao painel e:
echo.
for /f "tokens=2 delims==" %%k in ('findstr /b "ADMIN_SECRET=" "sistema\\.env"') do echo        %%k
echo.
echo   Copie a chave acima e cole na tela que vai abrir.
echo   (O servidor precisa estar rodando - 3-INICIAR.cmd)
echo.
start "" http://localhost:3000/admin.html
pause
exit /b 0

:semconfig
echo   Rode primeiro o 2-CONFIGURAR.cmd
pause
exit /b 1
`;

const PARAR = `@echo off
title Verimulta - Parar o servidor
echo.
echo   Parando o Verimulta...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
  echo   Nenhum servidor estava rodando.
) else (
  echo   Servidor parado.
)
echo.
echo   Observacao: isto encerra TODOS os programas Node deste
echo   computador, nao so o Verimulta.
echo.
pause
`;

// ------------------------------------------------------------- publicar
// O publicar.js vive em modelos/ como arquivo normal e e lido do disco na hora
// de montar. Embutido num template literal ele exigia escape triplo de crase,
// barra e ${}, e ninguem conseguia revisar o que de fato ia para o pacote.
const PUBLICAR_JS = fs.readFileSync(path.join(__dirname, 'modelos', 'publicar.js'), 'utf8');

// --------------------------------------------------------------- configurar
const CONFIGURAR_JS = `/**
 * VERIMULTA — configuracao rapida.
 * Gera os segredos e grava sistema/.env. Sem perguntas: o que da para decidir
 * sozinho fica decidido, e o que depende de conta de terceiro (Mercado Pago,
 * e-mail, OCR) entra comentado, para preencher quando for colocar no ar.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV = path.join(__dirname, 'sistema', '.env');
const segredo = (n) => crypto.randomBytes(n).toString('base64url');

if (fs.existsSync(ENV)) {
  const atual = fs.readFileSync(ENV, 'utf8');
  const chave = (atual.match(/^ADMIN_SECRET=(.*)$/m) || [])[1];
  console.log('');
  console.log('  Ja existe uma configuracao neste computador.');
  console.log('  Nada foi alterado.');
  console.log('');
  if (chave) {
    console.log('  Sua chave do Painel do Dono e:');
    console.log('');
    console.log('        ' + chave.trim());
    console.log('');
  }
  console.log('  Para comecar do zero, apague o arquivo sistema/.env');
  console.log('  e rode este atalho de novo.');
  console.log('');
  console.log('  Proximo passo: 3-INICIAR.cmd');
  console.log('');
  process.exit(0);
}

const admin = 'Verimulta-' + segredo(9);
const conteudo = [
  '# Verimulta - configuracao deste computador',
  '# Gerado por 2-CONFIGURAR.cmd em ' + new Date().toISOString().slice(0, 10) + '.',
  '# Este arquivo NAO vai para o GitHub nem para o Render (esta no .gitignore).',
  '',
  '# --- Segredos (gerados aleatoriamente para esta maquina) ---',
  'ADMIN_SECRET=' + admin,
  'JWT_SECRET=' + segredo(32),
  'WEBHOOK_SECRET=' + segredo(32),
  '',
  '# --- Modo de operacao ---',
  '# demo = ninguem e cobrado de verdade. E o certo para testar.',
  'GATEWAY=demo',
  'FONTES_MONITORAMENTO=demo',
  'FUSO_HORARIO=America/Sao_Paulo',
  'URL_BASE=http://localhost:3000',
  '',
  '# --- Para quando for colocar no ar (tire o # e preencha) ---',
  '# GATEWAY=mercadopago',
  '# MP_ACCESS_TOKEN=APP_USR-...',
  '# WEBHOOK_SECRET=<a assinatura secreta que o painel do Mercado Pago mostra>',
  '# SMTP_HOST=smtp.zoho.com',
  '# SMTP_PORT=465',
  '# SMTP_USER=contato@verimulta.com.br',
  '# SMTP_PASS=<senha de aplicativo>',
  '# EMAIL_FROM=Verimulta <contato@verimulta.com.br>',
  '# GOOGLE_VISION_KEY=<chave da Cloud Vision API>',
  '',
  '# --- Consulta a bases externas (quando o contrato sair) ---',
  '# O app fala com uma interface, nao com um fornecedor: preencha abaixo com',
  '# o que a documentacao do fornecedor autorizado disser, e a consulta liga',
  '# sem mexer em codigo. Veja o estado em /v1/fontes.',
  '# FONTE_HTTP_URL=https://api.fornecedor.br/veiculo/{placa}',
  '# FONTE_HTTP_CABECALHOS={"Authorization":"Bearer SUA-CHAVE"}',
  '# FONTE_HTTP_RAIZ=resultado.veiculo',
  '# FONTE_HTTP_MAPA={"modelo":"marcaModelo","ano":"anoFab","cor":"cor"}',
  '# FONTE_HTTP_FORNECE=veiculo,multas',
  '# FONTE_HTTP_ROTULO=Nome do fornecedor',
  '# FONTE_HTTP_OFICIAL=true',
  ''
].join('\\r\\n');

fs.writeFileSync(ENV, conteudo, 'utf8');

console.log('');
console.log('  ============================================================');
console.log('   CONFIGURADO');
console.log('  ============================================================');
console.log('');
console.log('   Sua chave do Painel do Dono (anote):');
console.log('');
console.log('        ' + admin);
console.log('');
console.log('   Ela tambem fica guardada em sistema/.env, e o atalho');
console.log('   4-PAINEL-DO-DONO.cmd mostra ela sempre que voce precisar.');
console.log('');
console.log('   O sistema esta em MODO DEMONSTRACAO: ninguem e cobrado');
console.log('   e nenhum e-mail sai. E o modo certo para testar.');
console.log('');
console.log('   Proximo passo: 3-INICIAR.cmd');
console.log('');
`;

// ------------------------------------------------------------------ leia-me
function comeceAqui(hoje, assercoes) {
  return `VERIMULTA - COMECE AQUI
=======================================================================
PRIMECORP BROKERS - CONSULTORIA E INTERMEDIACAO DE NEGOCIOS LTDA
CNPJ 55.745.297/0001-06 - pacote gerado em ${hoje}


PARA COMECAR A TESTAR: 3 CLIQUES
-----------------------------------------------------------------------
  Clique duas vezes, na ordem:

    1-INSTALAR.cmd      baixa o necessario e confere o sistema
    2-CONFIGURAR.cmd    cria as chaves e mostra a sua senha do painel
    3-INICIAR.cmd       liga o Verimulta e abre o aplicativo

  Depois disso:

    4-PAINEL-DO-DONO.cmd   abre o painel e lembra a sua chave
    5-SERVIDOR-24H.cmd     modo servidor: sobe sozinho se cair
    6-LINK-DO-CELULAR.cmd  endereco na sua rede (mesmo wi-fi)
    7-PUBLICAR-NA-INTERNET.cmd  poe no ar com HTTPS, para qualquer
                           pessoa acessar de qualquer lugar
    8-ENDERECO-FIXO.cmd    endereco definitivo no seu dominio
    PARAR.cmd              desliga o servidor

  So o 1-INSTALAR precisa de internet e so roda uma vez.


O QUE TEM AQUI DENTRO
-----------------------------------------------------------------------
  sistema/    o Verimulta inteiro: site, app, API, painel do dono,
              motor de auditoria, pagamentos, e-mails e os testes
  site/       a vitrine estatica (opcional, para o Netlify)
  manuais/    Guia de Ativacao (leia este quando for para o ar),
              Handoff do Desenvolvedor, Cronograma Go-Live e o
              material do beta: Termo de Participacao e Roteiro
              de Teste para entregar aos participantes


O QUE VOCE VAI VER
-----------------------------------------------------------------------
  Aplicativo ....... http://localhost:3000/app.html
  Painel do Dono ... http://localhost:3000/admin.html
  Site ............. http://localhost:3000/index.html

  No aplicativo: crie uma conta, aceite os termos, escaneie a
  multa-exemplo, veja o Indice de Consistencia, assine um plano no
  modo demonstracao e gere a Defesa Previa em PDF.

  No painel: entre com a chave que o 2-CONFIGURAR mostrou e
  acompanhe usuarios, assinaturas e MRR.


IMPORTANTE ENQUANTO VOCE TESTA
-----------------------------------------------------------------------
  * MODO DEMONSTRACAO: ninguem e cobrado de verdade e nenhum e-mail
    sai. E o modo certo para mexer a vontade.

  * O banco fica no arquivo sistema/verimulta.db. Apagou, zerou os
    testes. E normal e nao quebra nada.

  * A janela preta do 3-INICIAR.cmd precisa ficar ABERTA enquanto
    voce usa. Fechou a janela, o site para de responder.

  * ${assercoes} verificacoes automaticas rodam no passo 1. Se alguma
    falhar, nao coloque no ar: tire print e mande para o desenvolvedor.


PARA OS PARTICIPANTES DO BETA TESTAREM NO CELULAR
-----------------------------------------------------------------------
  O aplicativo instala pelo navegador, sem loja: a pessoa abre o
  endereco e usa "Adicionar a tela inicial". O atalho
  6-LINK-DO-CELULAR.cmd mostra o endereco e abre a pagina com o
  QR Code pronto para compartilhar.

  Para os 30 acessarem de casa, use o 7-PUBLICAR-NA-INTERNET.cmd:
  ele abre um tunel com HTTPS valido e devolve o endereco pronto para
  compartilhar. Nao precisa abrir porta no roteador nem expor o IP da
  sua casa.

  IMPORTANTE: o endereco do atalho 7 e TEMPORARIO e muda a cada vez
  que voce fecha a janela. Para o beta de 30 dias, use o atalho 8 e
  fixe o endereco no seu dominio - senao quem instalou o app no
  celular fica com um atalho quebrado.

  O iPhone so instala o app na tela de inicio se o endereco for HTTPS.
  Por isso o tunel, e nao o endereco de wi-fi.

  Antes de convidar, entregue os dois documentos da pasta manuais:
  Verimulta_Termo_do_Beta.pdf e Verimulta_Roteiro_do_Beta.pdf.


PARA COLOCAR NO AR DE VERDADE E COMECAR A RECEBER
-----------------------------------------------------------------------
  Siga manuais/Verimulta_Guia_de_Ativacao.pdf. Ele leva do GitHub ao
  primeiro pagamento, com a lista de todas as chaves a preencher e o
  Checklist de Homologacao de 20 itens.

  O QUE AINDA FALTA, em ordem de prioridade, esta no arquivo
  O-QUE-FALTA-PARA-VENDER.txt, aqui nesta pasta. Risque ali conforme
  for concluindo.


A REGRA DA CASA
-----------------------------------------------------------------------
  Nunca prometer cancelamento da multa. Nunca inventar multa.
  A estimativa e sempre estimativa: quem decide e o orgao julgador.

Chegou quem verifica.
`;
}

/**
 * Monta o pacote em `destino`. Devolve a contagem por pasta.
 */
function montar(destino, { assercoes = 72 } = {}) {
  const hoje = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(destino, { recursive: true });

  const contagem = {
    sistema: copiar(SISTEMA, path.join(destino, 'sistema')),
    site: copiar(NETLIFY, path.join(destino, 'site')),
    manuais: copiar(MANUAIS, path.join(destino, 'manuais'))
  };

  // A auditoria vai junto: o pacote não esconde o que está em aberto.
  fs.copyFileSync(AUDITORIA, path.join(destino, 'manuais', 'AUDITORIA-DO-CODIGO.md'));

  const escrever = (nome, texto, bom = false) =>
    fs.writeFileSync(path.join(destino, nome), (bom ? '﻿' : '') + texto, 'utf8');

  // BOM no .txt para o Bloco de Notas mostrar os acentos certos.
  escrever('COMECE-AQUI.txt', comeceAqui(hoje, assercoes), true);
  // A lista honesta do que separa o sistema de hoje de um produto vendavel.
  // Vive em modelos/ e vai junto do pacote para nao ficar so no repositorio.
  escrever('O-QUE-FALTA-PARA-VENDER.txt',
    fs.readFileSync(path.join(__dirname, 'modelos', 'O-QUE-FALTA-PARA-VENDER.txt'), 'utf8'), true);
  escrever('1-INSTALAR.cmd', INSTALAR);
  escrever('2-CONFIGURAR.cmd', CONFIGURAR);
  escrever('3-INICIAR.cmd', INICIAR);
  escrever('4-PAINEL-DO-DONO.cmd', PAINEL);
  escrever('5-SERVIDOR-24H.cmd', SERVIDOR24H);
  escrever('7-PUBLICAR-NA-INTERNET.cmd', PUBLICAR);
  escrever('8-ENDERECO-FIXO.cmd', ENDERECOFIXO);
  escrever('publicar.js', PUBLICAR_JS);
  escrever('6-LINK-DO-CELULAR.cmd', LINKCELULAR);
  escrever('PARAR.cmd', PARAR);
  escrever('configurar.js', CONFIGURAR_JS);

  return contagem;
}

module.exports = { montar, copiar };
