/**
 * VERIMULTA — publica o servidor local na internet, com HTTPS.
 *
 * POR QUE TUNEL E NAO ABRIR PORTA NO ROTEADOR
 * Abrir porta expoe o IP da sua casa, exige IP fixo (ou DNS dinamico) e nao
 * resolve o certificado. E o iPhone SO instala o app na tela de inicio se o
 * endereco for HTTPS com certificado valido. O tunel resolve os tres de uma
 * vez: sai pela conexao de saida (nada de porta aberta), o certificado e da
 * Cloudflare e o endereco ja nasce https.
 *
 * DOIS MODOS
 *   node publicar.js          teste imediato. Endereco temporario, sem conta.
 *   node publicar.js --fixo   endereco definitivo no seu dominio, passo a
 *                             passo, conferindo o estado a cada etapa.
 *
 * O modo rapido e para HOJE, com 2 ou 3 pessoas. Para o beta de 30 dias use
 * o modo fixo: o endereco temporario MUDA a cada reinicio, e quem instalou o
 * app no celular fica com um atalho quebrado.
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const dns = require('dns').promises;
const readline = require('readline');

const RAIZ = __dirname;
const SISTEMA = path.join(RAIZ, 'sistema');
const ENV = path.join(SISTEMA, '.env');
const CLOUDFLARED = path.join(RAIZ, 'cloudflared.exe');
const PASTA_CF = path.join(os.homedir(), '.cloudflared');
const PORTA = 3000;
const NOME_TUNEL = 'verimulta';
const FIXO = process.argv.includes('--fixo');

const linha = (t = '') => console.log(t);
const titulo = (t) => { linha(); linha('  ' + '='.repeat(60)); linha('   ' + t); linha('  ' + '='.repeat(60)); linha(); };

function perguntar(texto, padrao) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(texto, r => {
    rl.close();
    resolve(String(r || '').trim() || padrao);
  }));
}

// ------------------------------------------------------------ pre-requisitos
function conferirPreRequisitos() {
  if (!fs.existsSync(path.join(SISTEMA, 'node_modules'))) {
    linha('   Falta instalar. Rode antes o 1-INSTALAR.cmd');
    process.exit(1);
  }
  if (!fs.existsSync(ENV)) {
    linha('   Falta configurar. Rode antes o 2-CONFIGURAR.cmd');
    process.exit(1);
  }
}

/** Baixa o cloudflared na primeira vez (55 MB). Fica na pasta, nao no sistema. */
function baixarCloudflared() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(CLOUDFLARED)) return resolve(false);
    linha('   Baixando o cloudflared (55 MB, so na primeira vez)...');
    const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    const arquivo = fs.createWriteStream(CLOUDFLARED);
    const pegar = (endereco) => https.get(endereco, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return pegar(r.headers.location);
      if (r.statusCode !== 200) return reject(new Error('download falhou: HTTP ' + r.statusCode));
      r.pipe(arquivo);
      arquivo.on('finish', () => arquivo.close(() => { linha('   cloudflared pronto.'); resolve(true); }));
    }).on('error', reject);
    pegar(url);
  });
}

function cf(argumentos, opcoes = {}) {
  return spawnSync(CLOUDFLARED, argumentos, { encoding: 'utf8', ...opcoes });
}

/** Grava (ou troca) uma variavel no .env, preservando o resto. */
function definirNoEnv(chave, valor) {
  const linhas = fs.readFileSync(ENV, 'utf8').split(/\r?\n/);
  let achou = false;
  const saida = linhas.map(l => {
    if (new RegExp('^' + chave + '=').test(l.trim())) { achou = true; return `${chave}=${valor}`; }
    return l;
  });
  if (!achou) saida.push(`${chave}=${valor}`);
  fs.writeFileSync(ENV, saida.join('\r\n'), 'utf8');
}

function lerDoEnv(chave) {
  if (!fs.existsSync(ENV)) return null;
  const m = fs.readFileSync(ENV, 'utf8').match(new RegExp('^' + chave + '=(.*)$', 'm'));
  return m ? m[1].trim() : null;
}

/** Espera a porta 3000 responder antes de expor o tunel. */
function esperarServidor(tentativas = 40) {
  return new Promise((resolve, reject) => {
    const tentar = (n) => {
      const req = require('http').get({ host: '127.0.0.1', port: PORTA, path: '/v1/saude', timeout: 1500 },
        (r) => { r.resume(); resolve(); });
      req.on('error', () => n <= 1 ? reject(new Error('o servidor nao subiu')) : setTimeout(() => tentar(n - 1), 500));
      req.on('timeout', () => req.destroy());
    };
    tentar(tentativas);
  });
}

// ------------------------------------------------------------ modo rapido
async function modoRapido() {
  titulo('PUBLICAR NA INTERNET - ENDERECO TEMPORARIO');
  linha('   Para testar hoje, com poucas pessoas. Sem conta, sem cadastro.');
  linha();
  linha('   ATENCAO: este endereco MUDA toda vez que voce fechar e abrir.');
  linha('   Para o beta de 30 dias, use o 8-ENDERECO-FIXO.cmd');
  linha();

  await baixarCloudflared();

  // O servidor sobe PRIMEIRO. Se o tunel abre com a porta 3000 muda, o
  // cloudflared registra a origem como fora do ar e acaba trocando a URL —
  // a que foi impressa na tela deixa de existir e ninguem consegue entrar.
  linha('   Subindo o servidor...');
  let servidor = spawn(process.execPath, ['servidor.js'], { cwd: SISTEMA, stdio: 'inherit' });
  servidor.on('exit', (c) => { linha(`   O servidor parou (codigo ${c}).`); encerrar(); });
  await esperarServidor();

  linha('   Abrindo o tunel...');
  const registro = fs.createWriteStream(path.join(RAIZ, 'tunel.log'), { flags: 'w' });
  const tunel = spawn(CLOUDFLARED, ['tunnel', '--url', `http://localhost:${PORTA}`, '--no-autoupdate'],
    { stdio: ['ignore', 'pipe', 'pipe'] });

  let endereco = null;

  const reiniciarServidor = () => {
    try { servidor.removeAllListeners('exit'); servidor.kill(); } catch (e) {}
    servidor = spawn(process.execPath, ['servidor.js'], { cwd: SISTEMA, stdio: 'inherit' });
    servidor.on('exit', (c) => { linha(`   O servidor parou (codigo ${c}).`); encerrar(); });
  };

  const procurarUrl = (texto) => {
    if (endereco) return;
    const m = String(texto).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (!m) return;
    endereco = m[0];
    definirNoEnv('URL_BASE', endereco);

    // O servidor subiu antes do tunel e por isso leu o URL_BASE antigo.
    // Reinicia agora, com o endereco de hoje — senao o QR Code e a pagina de
    // instalacao apontam para um endereco morto.
    reiniciarServidor();

    titulo('NO AR');
    linha('   Endereco para compartilhar com quem vai testar:');
    linha();
    linha('        ' + endereco + '/instalar.html');
    linha();
    linha('   Essa pagina mostra o QR Code e os passos de instalacao');
    linha('   para Android e iPhone.');
    linha();
    linha('   Painel do Dono: ' + endereco + '/admin.html');
    linha('   Sua chave .....: ' + (lerDoEnv('ADMIN_SECRET') || '(veja o 4-PAINEL-DO-DONO.cmd)'));
    linha();
    linha('   Se o endereco NAO abrir neste computador mas abrir no');
    linha('   celular, o problema e o DNS do seu roteador, nao o sistema.');
    linha('   Ajuste o DNS desta maquina para 1.1.1.1 e resolve.');
    linha();
    linha('   Deixe ESTA JANELA ABERTA. Fechou, sai do ar.');
    linha('  ' + '='.repeat(60));
    linha();

    spawn('cmd', ['/c', 'start', '', endereco + '/instalar.html'], { detached: true, stdio: 'ignore' });
  };

  const anotar = (d) => { registro.write(d); procurarUrl(d); };
  tunel.stdout.on('data', anotar);
  tunel.stderr.on('data', anotar);   // o cloudflared imprime a URL no stderr
  tunel.on('exit', (c) => { linha(`   O tunel caiu (codigo ${c}).`); encerrar(); });

  const encerrar = () => {
    try { tunel.kill(); } catch (e) {}
    try { if (servidor) servidor.kill(); } catch (e) {}
    process.exit(0);
  };
  process.on('SIGINT', encerrar);

  setTimeout(() => {
    if (!endereco) {
      linha('   Nao consegui obter o endereco em 60 segundos.');
      linha('   Verifique a internet e tente de novo.');
      encerrar();
    }
  }, 60000);
}

// ------------------------------------------------------------ modo fixo
/**
 * Os nameservers do dominio ja apontam para a Cloudflare?
 * Consulta resolvedores publicos antes do resolvedor da maquina: o DNS do
 * roteador daqui ja mostrou que nao resolve tudo, e uma resposta vazia faria
 * o script mandar a pessoa refazer um passo que ela ja concluiu.
 */
async function nameserversDaCloudflare(dominio) {
  const consultar = (servidores) => {
    const r = new dns.Resolver();
    if (servidores) r.setServers(servidores);
    return r.resolveNs(dominio);
  };
  for (const servidores of [['1.1.1.1', '8.8.8.8'], null]) {
    try {
      const ns = await consultar(servidores);
      return { ns, cloudflare: ns.some(n => /cloudflare\.com$/i.test(n)) };
    } catch (e) { /* tenta o proximo resolvedor */ }
  }
  return { ns: [], cloudflare: false, erro: 'sem_resposta' };
}

async function modoFixo() {
  titulo('ENDERECO DEFINITIVO NO SEU DOMINIO');
  linha('   Este e o modo do beta: o endereco nao muda, entao quem instalou');
  linha('   o app no celular continua com o atalho certo por 30, 40 dias.');
  linha();

  await baixarCloudflared();

  const padraoHost = lerDoEnv('URL_BASE')?.replace(/^https?:\/\//, '') || 'beta.verimulta.com.br';
  const host = await perguntar(`   Endereco que voce quer usar [${padraoHost}]: `, padraoHost);
  const dominio = host.split('.').slice(-3).join('.');   // beta.verimulta.com.br -> verimulta.com.br

  // ---------- etapa 1: nameservers ----------
  linha();
  linha(`   [1/5] Conferindo os nameservers de ${dominio}...`);
  const { ns, cloudflare } = await nameserversDaCloudflare(dominio);
  linha('         hoje: ' + (ns.length ? ns.join(', ') : '(nao consegui consultar)'));

  if (!cloudflare) {
    linha();
    linha('   O dominio ainda NAO esta na Cloudflare. Faca isto primeiro:');
    linha();
    linha('   a) Crie a conta gratuita em dash.cloudflare.com');
    linha(`   b) "Add a site" > digite ${dominio} > plano Free`);
    linha('   c) A Cloudflare mostra DOIS nameservers. Anote os dois.');
    linha('   d) Entre em registro.br > seu dominio > DNS >');
    linha('      "Alterar servidores DNS" > troque pelos dois da Cloudflare');
    linha();
    linha('   A propagacao leva de 1 a 24 horas. Rode este atalho de novo');
    linha('   depois; ele confere sozinho e segue do ponto certo.');
    linha();
    linha('   Nada e derrubado nesse processo: conferi que ' + dominio);
    linha('   nao tem site nem e-mail publicados hoje.');
    linha();
    return;
  }
  linha('         OK — o dominio ja responde pela Cloudflare.');

  // ---------- etapa 2: login ----------
  linha();
  linha('   [2/5] Autorizacao do cloudflared...');
  const temCertificado = fs.existsSync(path.join(PASTA_CF, 'cert.pem'));
  if (!temCertificado) {
    linha('         Vou abrir o navegador. Escolha o dominio ' + dominio + ' e autorize.');
    linha('         (se nao abrir sozinho, copie o endereco que aparecer abaixo)');
    linha();
    const r = spawnSync(CLOUDFLARED, ['tunnel', 'login'], { stdio: 'inherit' });
    if (r.status !== 0 || !fs.existsSync(path.join(PASTA_CF, 'cert.pem'))) {
      linha();
      linha('         Autorizacao nao concluida. Rode o atalho de novo.');
      return;
    }
  }
  linha('         OK — autorizado.');

  // ---------- etapa 3: tunel ----------
  linha();
  linha('   [3/5] Tunel "' + NOME_TUNEL + '"...');
  const lista = cf(['tunnel', 'list']);
  let idTunel = null;
  const achado = (lista.stdout || '').split('\n').find(l => new RegExp('\\b' + NOME_TUNEL + '\\b').test(l));
  if (achado) {
    idTunel = achado.trim().split(/\s+/)[0];
    linha('         ja existe (id ' + idTunel + ').');
  } else {
    const criar = cf(['tunnel', 'create', NOME_TUNEL]);
    process.stdout.write(criar.stdout || '');
    const m = (criar.stdout || '').match(/[0-9a-f-]{36}/);
    if (!m) { linha('         Nao consegui criar o tunel. Saida acima.'); return; }
    idTunel = m[0];
    linha('         criado (id ' + idTunel + ').');
  }

  // ---------- etapa 4: DNS do subdominio ----------
  linha();
  linha('   [4/5] Apontando ' + host + ' para o tunel...');
  const rota = cf(['tunnel', 'route', 'dns', NOME_TUNEL, host]);
  const saidaRota = (rota.stdout || '') + (rota.stderr || '');
  if (/already exists|record with that host/i.test(saidaRota)) linha('         ja estava apontado.');
  else if (rota.status === 0) linha('         OK.');
  else { linha('         Falhou:'); linha('         ' + saidaRota.trim().split('\n')[0]); return; }

  // ---------- etapa 5: configuracao ----------
  linha();
  linha('   [5/5] Gravando a configuracao...');
  const credencial = path.join(PASTA_CF, idTunel + '.json');
  const config = path.join(PASTA_CF, 'config.yml');
  fs.writeFileSync(config,
    `tunnel: ${idTunel}\n` +
    `credentials-file: ${credencial}\n` +
    `ingress:\n` +
    `  - hostname: ${host}\n` +
    `    service: http://localhost:${PORTA}\n` +
    `  - service: http_status:404\n`, 'utf8');
  definirNoEnv('URL_BASE', 'https://' + host);
  linha('         config.yml gravado e URL_BASE fixado em https://' + host);

  titulo('PRONTO');
  linha('   Endereco do beta:');
  linha();
  linha('        https://' + host + '/instalar.html');
  linha();
  linha('   Esse endereco NAO muda mais. Pode mandar para os 30.');
  linha();
  linha('   PARA SUBIR AGORA (duas janelas):');
  linha('     1. 5-SERVIDOR-24H.cmd     (mantem o Verimulta de pe)');
  linha(`     2. cloudflared.exe tunnel run ${NOME_TUNEL}`);
  linha();
  linha('   PARA FICAR 24 HORAS NO AR SOZINHO:');
  linha('     Abra o PowerShell como Administrador nesta pasta e rode:');
  linha('       .\\cloudflared.exe service install');
  linha('     Depois arraste o 5-SERVIDOR-24H.cmd para a pasta que abre');
  linha('     com Win+R > shell:startup (segurando Alt, para criar atalho).');
  linha();
  linha('   Assim, se a maquina reiniciar, os dois voltam sozinhos.');
  linha();

  const subir = await perguntar('   Quer subir o tunel agora? [s/N]: ', 'n');
  if (/^s/i.test(subir)) {
    linha();
    linha('   Subindo o servidor...');
    const servidor = spawn(process.execPath, ['servidor.js'], { cwd: SISTEMA, stdio: 'inherit' });
    await esperarServidor();
    linha('   Subindo o tunel. Deixe esta janela aberta.');
    const t = spawn(CLOUDFLARED, ['tunnel', 'run', NOME_TUNEL], { stdio: 'inherit' });
    const fim = () => { try { t.kill(); } catch (e) {} try { servidor.kill(); } catch (e) {} process.exit(0); };
    process.on('SIGINT', fim);
    t.on('exit', fim);
  }
}

// ------------------------------------------------------------ inicio
conferirPreRequisitos();
const alvo = FIXO ? modoFixo : modoRapido;
alvo().catch(e => { linha('   Falha: ' + e.message); process.exit(1); });
