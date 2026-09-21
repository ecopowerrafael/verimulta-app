/**
 * VERIMULTA — conteúdo dos documentos operacionais.
 *
 * Cada função compõe um PDF. O texto aqui é a ÚNICA fonte dos manuais: se o
 * sistema mudar, muda aqui e roda `npm run docs`. A conferência automática
 * (conferir.js) compara os fatos citados contra o código de verdade.
 */
const { Deck, COR } = require('./deck');

const CNPJ = 'CNPJ 55.745.297/0001-06';
const RODAPE = `PRIMECORP BROKERS — CONSULTORIA E INTERMEDIAÇÃO DE NEGÓCIOS LTDA · ${CNPJ}`;
const WEBHOOK = 'https://www.verimulta.com.br/v1/webhooks/mercadopago';

// ---------------------------------------------------------------- 1
/**
 * O guia único de ativação.
 *
 * Substitui os três manuais que explicavam o MESMO caminho (Plano de Ativação,
 * Manual de Instalação e Do Zero ao Ar) para leitores diferentes. Manter três
 * versões do mesmo procedimento foi o que permitiu que elas divergissem entre
 * si e do código — uma mandava cadastrar um webhook que respondia 404, outra
 * vendia um plano que o checkout recusava.
 */
async function guiaDeAtivacao(arquivo) {
  const d = new Deck({ arquivo, rodape: RODAPE });

  d.capa({
    eyebrow: 'guia de ativação · do zero ao primeiro pagamento',
    titulo: ['Ligar o Verimulta', '~e começar a vender'],
    subtitulo: 'Um documento só, na ordem exata: teste no seu PC » servidor no ar » domínio » dinheiro » e-mail » OCR » teste de fogo » homologação. Escrito para **você** executar sozinho; ao fim dele o cliente paga e recebe o acesso sem você tocar em nada.'
  });

  d.folha({ eyebrow: 'o mapa · como as peças se encaixam', titulo: 'Quem faz o quê (honestidade técnica)' });
  d.cartoes([
    { titulo: 'O provedor do domínio — a casa do nome', corpo: 'Guarda `verimulta.com.br` e a Zona DNS. Opcionalmente hospeda o e-mail `contato@verimulta.com.br`. **Por que não o sistema inteiro aqui?** Hospedagem de site comum não executa Node.js — e o nosso motor é Node.' },
    { titulo: 'Render — a casa do motor', corpo: 'O **sistema completo** (site + app + API + painel + webhook) roda aqui, com deploy de 1 clique pelo `render.yaml`. O domínio apenas **aponta** para ele: o cliente só vê `www.verimulta.com.br` e nunca sabe onde mora o motor.', destaque: true }
  ], 2, { y: d.y + 2 });
  d.tabela({
    colunas: ['Endereço', 'Aponta para', 'Onde se configura'],
    larguras: [1.1, 1.05, 1.65],
    tamanho: 9,
    respiro: 12,
    linhas: [
      ['`www.verimulta.com.br`', 'Render (sistema completo)', 'Zona DNS » registro **CNAME** `www` » [destino do Render]'],
      ['`verimulta.com.br` (raiz)', 'Redirect para `www`', 'Painel do provedor » Redirecionamento de domínio'],
      ['`contato@verimulta.com.br`', 'Zoho Mail (ou o provedor)', 'Criar a caixa + **senha de aplicativo** para o SMTP']
    ],
    y: d.y + 8
  });
  d.nota('Custo de operação: Render Starter **US$ 7/mês** + domínio. O plano Free hiberna, e um serviço hibernado pode perder a notificação de pagamento do Mercado Pago.');

  d.folha({ eyebrow: 'antes de começar · as duas dúvidas de sempre', titulo: '"Failed to fetch" e a Chave do Administrador' });
  d.faixa('**O diagnóstico:** o Painel do Dono (`admin.html`) precisa conversar com a API. Abrindo o arquivo com um duplo clique, sem servidor rodando, ele diz "Failed to fetch". **Nada está quebrado** — falta ligar o motor (Etapa 1 ou Etapa 2).');
  d.cartoes([
    { titulo: 'A Chave do Administrador', corpo: 'É a variável `ADMIN_SECRET`. **No Render você não inventa nada:** o Blueprint gera um valor aleatório — copie em Environment quando for entrar no painel. Rodando no seu PC, você define a chave ao ligar o servidor. Não existe chave de fábrica, e isso é segurança.' },
    { titulo: 'Por que o sistema se recusa a subir', corpo: 'Com `NODE_ENV=production`, o servidor **aborta no boot** se faltar `JWT_SECRET`, `ADMIN_SECRET` ou `WEBHOOK_SECRET`, dizendo no log quais. É proposital: um deploy silenciosamente inseguro é pior que um deploy que não sobe.' }
  ], 2, { y: d.y + 2 });

  d.folha({ eyebrow: 'etapa 1 · teste completo no seu pc (15 min)', titulo: 'Ligar o sistema antes de publicar' });
  d.passos([
    { titulo: '1. Instale o Node.js', corpo: '`nodejs.org` » baixe a versão **LTS** (22, 23 ou 24 servem) » instale com Avançar-Avançar-Concluir.' },
    { titulo: '2. Abra a pasta do sistema no terminal', corpo: 'Entre na pasta `sistema` no Explorer (no ZIP de instalação ela fica na raiz; no repositório, em `6_CODIGO_FONTE/`) » clique na barra de endereço » digite `powershell` e Enter.' },
    { titulo: '3. Instale as dependências (só na 1ª vez)', corpo: 'Digite `npm install` e aguarde terminar.' },
    { titulo: '4. Confira que está tudo são', corpo: 'Digite `npm test`. Devem passar **56 asserções, 0 falhas** — motor de auditoria, extrator de OCR, grade de planos e o funil inteiro por HTTP. Falhou alguma? Não suba: me chame com o print.' },
    { titulo: '5. Use o sistema', corpo: 'Digite `$env:ADMIN_SECRET="SuaChaveAqui"; node servidor.js` » abra `http://localhost:3000/app.html` (o app) e `http://localhost:3000/admin.html` (o painel, com a sua chave). Crie uma conta, escaneie a multa-exemplo, assine no modo demonstração e gere a defesa. **Tudo funcionando = pronto para o mundo.** Para desligar: Ctrl+C.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'etapa 2 · o motor na nuvem (github + render · 35 min)', titulo: 'Colocar na internet de verdade' });
  d.passos([
    { titulo: '1. GitHub', corpo: '`github.com` » conta com o e-mail da empresa » **New repository** `verimulta` (**Private**) » "uploading an existing file" » arraste **o conteúdo** da pasta `sistema` (o `servidor.js` tem de ficar na raiz) » **Commit changes**.' },
    { titulo: '2. Render » Blueprint', corpo: '`render.com` » Sign up with GitHub » **New + » Blueprint** » repositório `verimulta` » **Apply**. O `render.yaml` monta o serviço, cria o disco e gera `JWT_SECRET` e `ADMIN_SECRET` sozinho.' },
    { titulo: '3. Confira o disco ANTES de seguir', corpo: '**Settings » Disks**: tem de existir um disco de 1 GB montado em `/var/data`, e `DB_PATH` = `/var/data/verimulta.db` em Environment. **Sem o disco, cada novo deploy apaga todos os usuários, multas, defesas e o histórico de pagamento.** O Blueprint já faz; confira mesmo assim.', cor: COR.alerta },
    { titulo: '4. Prova de vida', corpo: 'Espere o deploy ficar **Live** (bolinha verde) » abra `verimulta.onrender.com/app.html` no celular. Sistema na internet. Agora vamos dar o nome dele.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });
  d.nota('O repositório privado protege o código. A `.gitignore` já impede que banco, `node_modules` e segredos subam junto.');

  d.folha({ eyebrow: 'etapa 3 · o nome oficial (15 min + propagação)', titulo: 'www.verimulta.com.br apontando para o motor' });
  d.passos([
    { titulo: '1. No Render', corpo: 'Serviço » **Settings » Custom Domains** » Add `www.verimulta.com.br` » copie o destino CNAME que ele mostrar (algo como `verimulta.onrender.com`).' },
    { titulo: '2. Na Zona DNS do domínio', corpo: 'Painel do provedor » Domínios » `verimulta.com.br` » **Zona DNS / Editar DNS** » novo registro: Tipo **CNAME** · Nome `www` · Valor = o destino copiado » Salvar.' },
    { titulo: '3. Raiz redirecionando', corpo: 'Redirecionamento: `verimulta.com.br` » `https://www.verimulta.com.br`, para quem digitar sem `www` também chegar.' },
    { titulo: '4. Aguarde e confira', corpo: 'Propagação de 1 a 4 horas (24h no pior caso). Teste `www.verimulta.com.br` abrindo **com o cadeado** (SSL automático do Render). Por fim, ajuste `URL_BASE` no Render para o domínio final.' }
  ], { y: d.y + 6 });

  d.folha({ eyebrow: 'etapa 4 · o caixa (mercado pago · 30 min)', titulo: 'Cliente paga » acesso libera sozinho' });
  d.passos([
    { titulo: '1. Conta PJ', corpo: '`mercadopago.com.br` » criar conta com o CNPJ **55.745.297/0001-06** (PrimeCorp Brokers) » validar documentos » cadastrar a conta bancária de saque.' },
    { titulo: '2. Credencial de produção', corpo: '`mercadopago.com.br/developers` » **Suas integrações » Criar aplicação** » nome "Verimulta" » modelo **Pagamentos on-line / Assinaturas** » **Credenciais de produção** » copie o **Access Token** (`APP_USR-...`) » no Render: `GATEWAY`=`mercadopago` e `MP_ACCESS_TOKEN`= o token.' },
    { titulo: '3. Webhook — o endereço exato', corpo: `Na aplicação » **Webhooks / Notificações** » modo Produção » URL: \`${WEBHOOK}\` » marque **Pagamentos** e **Assinaturas (preapproval)** » Salvar » copie a **Assinatura secreta** » no Render: \`WEBHOOK_SECRET\` = essa assinatura. Salvou = redeploy automático.` }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });
  d.faixa('Dois detalhes que custam vendas se passarem batido. **(a)** O endereço termina em `/v1/webhooks/mercadopago` — confira caractere por caractere: endereço errado devolve 404, o MP reenfileira em silêncio e o cliente paga sem receber o plano. **(b)** `WEBHOOK_SECRET` é **a assinatura que o painel do MP mostra**, não um valor inventado: com um valor qualquer, toda notificação é recusada com 401 e o sintoma é exatamente o mesmo.', { y: d.y + 2, cor: COR.alerta, fundo: '#FDECEA' });

  d.folha({ eyebrow: 'etapa 4 · como a entrega de acesso funciona', titulo: 'O ciclo automático e a grade de planos' });
  d.faixa('**Em 6 batidas:** (1) o cliente toca "Assinar" » (2) o servidor cria a assinatura recorrente no MP e o cliente paga no checkout » (3) o MP dispara o webhook » (4) o servidor **valida a assinatura criptográfica** e **reconsulta o status real** no MP » (5) aprovado = o plano grava no usuário e os limites liberam na hora » (6) o e-mail de confirmação dispara e o Painel do Dono soma o MRR. **Zero toque seu.**');
  d.tabela({
    colunas: ['Plano pago', 'O que libera automaticamente'],
    larguras: [0.8, 3],
    tamanho: 9,
    respiro: 12,
    linhas: [
      ['`combo1` · **R$ 29,90**', '1 CNH + 2 veículos · auditoria completa · probabilidade · defesas ilimitadas · placas de terceiros'],
      ['`combo2` · **R$ 39,90**', '2 CNHs + 2 veículos (+1 dependente com o mesmo acesso)'],
      ['`combo3` · **R$ 49,90**', '3 CNHs + 3 veículos (+2 dependentes)'],
      ['`empresa_start` · **R$ 89,90**', 'CNPJ · 5 veículos + 2 usuários · indicação de condutor · pontos por motorista'],
      ['`empresa_pro` · **R$ 149,90**', '15 veículos + 5 usuários · relatórios gerenciais'],
      ['`frota` · sob proposta', 'R$ 11,90/veículo, degressivo — ative via contato comercial']
    ],
    y: d.y + 2
  });
  d.nota('Cancelou no app = o servidor cancela a recorrência no MP na hora. Pagamento recusado ou atrasado **não** ativa: o webhook só libera com status aprovado. Trilha completa de cada pagamento no Painel do Dono.');

  d.folha({ eyebrow: 'etapas 5 e 6 · e-mail e ocr (35 min)', titulo: 'As últimas duas chaves' });
  d.passos([
    { titulo: '5. E-mail `contato@verimulta.com.br` (Zoho grátis · 20 min)', corpo: '`zoho.com/mail` » **Forever Free** » adicionar o domínio » o Zoho mostra 2 registros (TXT de verificação + MX) » cadastre ambos na Zona DNS » crie a caixa `contato@` » em Segurança, gere uma **Senha de aplicativo** » no Render: `SMTP_HOST`=`smtp.zoho.com` · `SMTP_PORT`=`465` · `SMTP_USER`=`contato@verimulta.com.br` · `SMTP_PASS`=[senha de app] · `EMAIL_FROM`=`Verimulta <contato@verimulta.com.br>`. Teste: crie uma conta no app e veja o e-mail de boas-vindas chegar.' },
    { titulo: '6. OCR das fotos (Google Vision · 15 min)', corpo: '`console.cloud.google.com` » novo projeto "verimulta" » APIs e serviços » Biblioteca » **Cloud Vision API » Ativar** » Credenciais » Criar credencial » **Chave de API** » no Render: `GOOGLE_VISION_KEY`. São 1.000 leituras/mês grátis. **Sem a chave o app não quebra** — segue com preenchimento manual.' },
    { titulo: 'Monitoramento em produção', corpo: '`FONTES_MONITORAMENTO`=`demo` e **jamais** defina `DEMO_NOVA_MULTA` em produção — a regra da casa é nunca inventar multa. Os alertas de prazo funcionam desde o dia 1; a varredura de novos débitos expande com os convênios oficiais.', cor: COR.alerta }
  ], { y: d.y + 4 });

  d.folha({ eyebrow: 'o rascunho de chaves · imprima e preencha', titulo: 'Todas as variáveis num lugar só' });
  d.tabela({
    colunas: ['Variável (Render » Environment)', 'O que é', 'Quem preenche'],
    larguras: [1.05, 2.5, 0.72],
    tamanho: 8.2,
    respiro: 9,
    linhas: [
      ['`NODE_ENV`', '`production`. Torna os segredos obrigatórios e **fecha a ativação direta de plano**.', 'o Blueprint'],
      ['`DB_PATH`', '`/var/data/verimulta.db` — o disco persistente. Sem isto, **cada deploy apaga os clientes**.', 'o Blueprint'],
      ['`JWT_SECRET`', 'Assina os logins. O Render gera um valor aleatório.', 'o Blueprint'],
      ['`ADMIN_SECRET`', 'A chave do Painel do Dono. O Render gera — copie de lá para entrar.', 'o Blueprint'],
      ['`GATEWAY`', '`mercadopago` para cobrar de verdade. Em `demo`, **nada é faturado**.', '**você**'],
      ['`MP_ACCESS_TOKEN`', 'Access Token de produção do Mercado Pago (`APP_USR-...`).', '**você**'],
      ['`WEBHOOK_SECRET`', 'A **assinatura secreta do webhook**, copiada do painel do MP. Nunca inventada.', '**você**'],
      ['`URL_BASE`', '`https://www.verimulta.com.br` — retorno do checkout.', '**você**'],
      ['`SMTP_HOST` / `SMTP_PORT`', '`smtp.zoho.com` / `465` (ou o servidor da Locaweb).', '**você**'],
      ['`SMTP_USER` / `SMTP_PASS`', '`contato@verimulta.com.br` / a senha de aplicativo.', '**você**'],
      ['`EMAIL_FROM`', 'O remetente que o cliente vê.', '**você**'],
      ['`GOOGLE_VISION_KEY`', 'Chave da Vision API (OCR das fotos).', '**você**'],
      ['`ORIGENS_PERMITIDAS`', 'Domínios autorizados a chamar a API de fora. **Nunca** use `*`.', 'o Blueprint'],
      ['`FONTES_MONITORAMENTO`', '`demo` — produção honesta, sem inventar multa.', 'o Blueprint']
    ],
    y: d.y + 2
  });
  d.nota('Guarde este papel como guarda a senha do banco. `DEMO_NOVA_MULTA` **nunca entra em produção** — a regra da casa é não inventar multa.');

  d.folha({ eyebrow: 'etapa 7 · o teste de fogo (15 min)', titulo: 'A venda-piloto que autoriza o lançamento' });
  d.passos([
    { titulo: '1.', corpo: 'No celular, acesse `www.verimulta.com.br` » crie uma conta real com o **seu** e-mail » **marque o aceite dos Termos** (sem ele o cadastro não conclui — é exigência da LGPD) » confira o e-mail de boas-vindas chegando.' },
    { titulo: '2.', corpo: 'Fotografe uma notificação real » veja o OCR preencher » abra o diagnóstico » confirme o **Índice de Consistência** na manchete e o paywall travando a probabilidade.' },
    { titulo: '3.', corpo: 'Assine o **Combo 01 (R$ 29,90)** com o seu próprio cartão » conclua no checkout do MP » volte ao app » o badge deve virar **PLANO ATIVO** em até 1 minuto (o webhook trabalhando).' },
    { titulo: '4.', corpo: 'Gere a **Defesa Prévia** » **Emitir em PDF** » confira o timbre (o PDF vem do servidor, não da impressora do navegador) » gere também o **Extrato de Auditoria**. Abra `/admin.html` com a sua chave » veja o pagamento na trilha e **MRR = R$ 29,90**.' },
    { titulo: '5.', corpo: 'Cancele em 1 toque no perfil » confirme o cancelamento refletindo no MP. **Ciclo completo validado nos dois sentidos = pode vender para o Brasil.**' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'a folha do desenvolvedor · homologação', titulo: 'Checklist de Homologação — 20 itens' });
  d.listas({
    y: d.y,
    esquerda: {
      titulo: 'Sistema e segurança', cor: COR.placa, marcado: false, itens: [
        '**1.** Site abre em `www.verimulta.com.br` com SSL',
        '**2.** Cadastro **exige** o aceite e grava consentimento, data, IP e versão do termo',
        '**3.** E-mail de boas-vindas entregue',
        '**4.** Login/JWT funcionando · senha com hash bcrypt',
        '**5.** Scan da foto » OCR extrai AIT, órgão, datas e valor',
        '**6.** Motor roda as 14 verificações com base legal citada',
        '**7.** Estimativa **nunca chega a 100%** (teto de 85% e teses correlacionadas)',
        '**8.** Paywall trava a probabilidade no plano grátis',
        '**9.** Rate limit responde 429 na força bruta de login',
        '**10.** `ORIGENS_PERMITIDAS` configurada — nenhum curinga em rota autenticada'
      ]
    },
    direita: {
      titulo: 'Dinheiro, dados e operação', cor: COR.ok, marcado: false, itens: [
        '**11.** Webhook em `/v1/webhooks/mercadopago` valida assinatura e reconsulta status',
        '**12.** Pagamento real ativa o plano em < 1 min · recusado **não** ativa',
        '**13.** Cancelamento reflete no MP',
        '**14.** `combo1/2/3` e planos PJ ativam com os limites certos',
        '**15.** Defesa e Extrato saem em **PDF timbrado gerado no servidor**',
        '**16.** Painel do Dono só abre com `ADMIN_SECRET`; MRR e trilha corretos',
        '**17.** Termos e Privacidade acessíveis · exportação e exclusão de conta funcionando',
        '**18.** Nenhum segredo no código (só variável de ambiente)',
        '**19.** `DEMO_NOVA_MULTA` ausente e `/v1/assinaturas/ativar` fechado em produção',
        '**20.** **Disco persistente montado** e backup do banco configurado e testado'
      ]
    }
  });
  d.nota('Assinatura do homologador: "Conferi os 20 itens e atesto que o sistema está apto a operar." — Nome/CPF + assinatura eletrônica. Só depois disso a mídia liga. `npm test` (56 asserções) cobre automaticamente os itens 2, 5, 6, 7, 8, 9, 11, 14, 15, 16, 17 e 19.');

  d.capa({
    fecho: true,
    eyebrow: 'ativação concluída',
    titulo: ['Site no ar. Caixa aberto.', 'Entrega automática por plano.', '~Agora: feed + pitch + R$ 35/dia.'],
    subtitulo: 'O domínio aponta, o Render roda, o Mercado Pago recebe e você comanda. O desenvolvedor só assina o "OK". Verifica, Brasil.'
  });
  return d.gravar();
}
// ---------------------------------------------------------------- 2
async function handoffDesenvolvedor(arquivo) {
  const d = new Deck({ arquivo, rodape: `VERIMULTA · HANDOFF DE DESENVOLVIMENTO · ${CNPJ}` });

  d.capa({
    eyebrow: 'kit do desenvolvedor · handoff técnico oficial · v2 · setembro 2026',
    titulo: ['VERIMULTA', '~Handoff de Desenvolvimento'],
    subtitulo: 'Este documento + o repositório = tudo o que uma equipe precisa para assumir, endurecer e escalar a plataforma sem uma única reunião de descoberta. O sistema **já funciona e é testado de ponta a ponta** — a missão aqui descrita é publicar nas lojas, ligar as integrações oficiais e fechar o que sobrou de operação.'
  });

  d.folha({ eyebrow: 'parte 1 · o que já está construído e testado', titulo: 'Mapa do código (6_CODIGO_FONTE/sistema)' });
  d.tabela({
    colunas: ['Arquivo', 'Responsabilidade', 'Status'],
    larguras: [0.78, 3.1, 0.62],
    tamanho: 8,
    respiro: 8,
    linhas: [
      ['`servidor.js`', 'API REST /v1 (Express): auth JWT, veículos, multas, scan, diagnóstico, defesas, PDF, assinaturas, webhook, admin e direitos do titular.', 'testado e2e'],
      ['`planos.js`', '**Fonte única** da grade. Servidor e checkout leem daqui; `ALIASES` mantém as chaves antigas válidas.', 'testado'],
      ['`motor_auditoria.js`', 'As 14 verificações A1–A14 (CTB 280–282, CONTRAN 900/918/2022, INMETRO 158/2022) + jurimetria v2 com correlação e teto.', 'caso real: 30%'],
      ['`config.js`', 'Segredos obrigatórios em produção (aborta no boot sem eles) + comparação `timingSafeEqual`.', 'testado'],
      ['`seguranca.js`', 'Rate limit por IP (janela deslizante), CORS por allowlist e cabeçalhos de endurecimento.', 'testado'],
            ['`fontes/`', 'Camada de fontes externas: o app fala com uma **interface**, não com um fornecedor. `fipe` (pública, ligada), `configuravel` (URL, cabeçalho e mapa de campos vindos do ambiente — o encaixe para o dia do contrato) e `demonstracao` (desligada, bloqueada em produção). Fonte fora do ar devolve `ok:false`, **nunca dado inventado**.', 'testado'],
      ['`datas.js`', 'Dia civil no fuso do motorista (`FUSO_HORARIO`, padrão America/Sao_Paulo). Prazo é dia de calendário: com UTC, das 21h em diante o alerta procurava o dia seguinte.', 'testado'],
      ['`pagamentos.js`', 'Mercado Pago: preapproval, webhook com HMAC + reconsulta de status, cancelamento em 1 toque.', 'ciclo validado'],
      ['`pdf.js`', 'Defesa Prévia e Extrato de Auditoria em PDF timbrado (pdfkit, sem dependência nativa).', 'testado'],
      ['`ocr.js`', 'Google Vision (quando há chave) + extrator de campos + tabela de pontuação do CTB.', 'testado'],
      ['`emails.js`', 'SMTP transacional: boas-vindas, pagamento confirmado, alertas de prazo 7/3/1 com dedup.', 'testado'],
      ['`monitor.js`', 'Varredura diária de prazos + fontes plugáveis (aguarda credenciamento — **nunca scraping**).', 'prazos ativos'],
      ['`banco.js`', 'SQLite (better-sqlite3) com migrations idempotentes embutidas.', 'testado'],
      ['`publico/`', '`app.html` (PWA), `index.html` (site), `admin.html` (painel), termos e privacidade.', 'testado'],
      ['`teste.js` / `teste_api.js`', '**56 asserções**: unitárias + integração HTTP do funil inteiro.', '0 falhas']
    ],
    y: d.y + 2
  });
  d.nota('Stack: Node 22–24 · Express · better-sqlite3 · JWT · pdfkit · PWA sem framework (zero dependência frágil).');

  d.folha({ eyebrow: 'parte 2 · referência da api v1', titulo: 'Endpoints principais' });
  d.tabela({
    colunas: ['Rota', 'Função'],
    larguras: [1.2, 2.5],
    tamanho: 7.9,
    respiro: 8,
    linhas: [
      ['`POST /v1/auth/register` · `/login`', 'Cadastro (**exige** `consentimento: true` e grava data, IP e versão do termo) e login » JWT. Rate limit por IP.'],
      ['`GET/POST /v1/veiculos`', 'Listar e adicionar placas (limites por plano).'],
      ['`POST /v1/multas/ler`', 'Lê o documento (foto ou texto) e devolve os campos **sem gravar nada** — o usuário confere antes. Sem chave de OCR, responde `leu:false` com orientação, em vez de campos vazios.'],
      ['`POST /v1/multas/scan`', 'Grava a multa com os campos **confirmados pelo usuário**. Confere se o `veiculo_id` é dele.'],
      ['`GET /v1/multas/:id/diagnostico`', 'Motor: 14 verificações + **Índice de Consistência** + probabilidade (com gating por plano).'],
      ['`POST /v1/recursos`', 'Gera a Defesa Prévia (402 sem assinatura — paywall no servidor).'],
      ['`GET /v1/recursos/:id/pdf`', '**Defesa Prévia em PDF timbrado**, gerada no servidor.'],
      ['`GET/POST /v1/cnh`', 'Pontos de 12 meses somados das multas do próprio usuário, com o limite do CTB art. 261 (20/30/40 conforme as gravíssimas). **Não é consulta ao Detran** — a resposta declara a origem. O POST grava a validade informada pelo titular.'],
      ['`GET /v1/veiculos/:id/resumo`', 'O que a plataforma sabe do veículo e, explicitamente, o que **não** sabe: licenciamento, IPVA, recall e dívida ativa seguem `nao_conectado` até o credenciamento.'],
      ['`GET /v1/multas/:id/extrato.pdf`', '**Extrato de Auditoria em PDF**: as 14 verificações com a base legal de cada uma.'],
      ['`POST /v1/checkout`', 'Demo ativa direto · Produção (`GATEWAY=mercadopago`) cria o preapproval e devolve o checkout.'],
      ['`POST /v1/webhooks/mercadopago`', '**O endereço a cadastrar no MP.** Valida HMAC » reconsulta o MP » libera/derruba o plano » e-mail » trilha. `/v1/webhooks/pagamento` responde igual (histórico).'],
      ['`POST /v1/assinaturas/ativar`', 'Só fora de produção. Com `NODE_ENV=production` devolve **403** qualquer que seja o gateway.'],
      ['`GET /v1/eu/dados` · `DELETE /v1/eu/conta`', 'LGPD art. 18: exportação completa e eliminação com anonimização.'],
      ['`GET /v1/admin/*` (`X-Admin-Secret`)', 'Painel do Dono: usuários, assinaturas, MRR, trilha de pagamentos.'],
      ['`GET /v1/saude`', 'Health check usado pelo Render.']
    ],
    y: d.y + 2
  });
  d.nota('Padrão: JSON, erros em `{erro}`, status HTTP corretos. Autenticação Bearer JWT · Admin por `X-Admin-Secret`. Contrato completo legível no `servidor.js`, comentado em português.');

  d.folha({ eyebrow: 'parte 3 · modelo de dados e ambiente', titulo: 'Tabelas e as chaves de ambiente' });
  d.cartoes([
    { titulo: 'Tabelas (banco.js)', corpo: '`usuarios` · `veiculos` · `multas` · `diagnosticos` · `recursos` · `assinaturas` · `pagamentos` · `emails_log` · `varreduras`.\n\nPKs inteiras, FKs indexadas, timestamps, migrations idempotentes. `usuarios` **guarda o consentimento**: flag, data, IP e versão do termo. Migração recomendada para Postgres no Gate 5.' },
    { titulo: 'Environment', corpo: '`NODE_ENV` · `DB_PATH` · `JWT_SECRET` · `ADMIN_SECRET` · `WEBHOOK_SECRET` · `GATEWAY` · `MP_ACCESS_TOKEN` · `URL_BASE` · `SMTP_HOST/PORT/USER/PASS` · `EMAIL_FROM` · `GOOGLE_VISION_KEY` · `ORIGENS_PERMITIDAS` · `FONTES_MONITORAMENTO` · `VERSAO_TERMOS` · `FUSO_HORARIO`.\n\n`DB_PATH` **tem de apontar para o disco persistente** (`/var/data`). `DEMO_NOVA_MULTA` jamais em produção.' },
    { titulo: 'O motor (coração intocável)', corpo: 'A1–A14 com base legal citada item a item; cada regra determinística e versionável. **Jurimetria v2:** teses do mesmo equipamento (A4–A8) e da mesma cadeia de notificação (A3, A13, A14) são famílias correlacionadas — a mais forte conta inteira, as demais com decaimento de 0,30 — e o resultado tem **teto de 85%**. Toda mudança de regra = teste novo + registro da versão que produziu o resultado.' },
    { titulo: 'PWA', corpo: '`manifest.json` + `sw.js` prontos (instalável no Android/iOS pelo navegador). Ícones 192/512 na pasta. Caminho para a loja: PWABuilder » TWA (Google Play, US$ 25). Push notifications = Pacote B.' }
  ], 2, { y: d.y + 4, tamanhoCorpo: 9 });

  d.folha({ eyebrow: 'parte 4 · a missão · pacote a (pré-escala)', titulo: 'Blindar: o que já foi feito e o que falta' });
  d.tabela({
    colunas: ['Entrega', 'Situação'],
    larguras: [2.4, 1.3],
    tamanho: 9,
    linhas: [
      ['Suíte de testes (unitário do motor + integração da API + e2e do funil pagar»liberar)', '**Feito** — 56 asserções. Falta CI verde obrigatório em PR.'],
      ['Hardening: rate limit, validação de upload, CORS por allowlist, cabeçalhos', '**Feito.** Falta revisão formal do OWASP Top 10 documentada.'],
      ['Consentimento LGPD gravado + direitos do titular (exportação e eliminação)', '**Feito.**'],
      ['Estimativa sem promessa de resultado (teto e correlação na jurimetria)', '**Feito.**'],
      ['MFA no Painel do Dono + logs imutáveis de operações sensíveis', 'Pendente — login admin exige 2º fator; trilha exportável.'],
      ['Backup automático do banco + restore testado + plano de incidente', 'Pendente — restore executado com sucesso em staging.'],
      ['Observabilidade: Sentry + logs estruturados + alerta de webhook falho com reprocesso', 'Pendente — falha simulada de webhook tem de se recuperar sozinha.'],
      ['Teste de carga (k6/artillery): 200 usuários no funil scan»diagnóstico', 'Pendente — p95 < 2s no diagnóstico, zero erro 5xx.'],
      ['Acessibilidade e revisão de copy com a matriz de evidência', 'Pendente — Índice de Consistência como manchete, escudo em toda estimativa.']
    ],
    y: d.y + 2
  });
  d.nota('Ambientes: dev » staging » prod · migrations por PR · zero dado sensível em log.');

  d.folha({ eyebrow: 'parte 4 · pacotes b e c', titulo: 'Publicar nas lojas e escalar as integrações' });
  d.cartoes([
    { titulo: 'Pacote B · Google Play (prioridade)', corpo: 'PWA » TWA via PWABuilder ou Bubblewrap · assets da loja prontos no KIT-LOJAS · conta developer US$ 25 · política de privacidade já no ar. **Aceite:** app publicado, instalável, atualização automática via PWA.' },
    { titulo: 'Pacote B · Push e polimento', corpo: 'Web Push (VAPID) no `sw.js` para nova multa, prazo 7/3/1 e pagamento confirmado, com **opt-in LGPD explícito**. Lighthouse >= 90 em performance/PWA/SEO · deep links · modo offline básico. iOS só após PMF (US$ 99/ano).' },
    { titulo: 'Pacote C · Data Gateway Serpro/Senatran', corpo: 'Camada desacoplada (adapter por fonte) consumindo as consultas contratadas via Credencia, com cache, retry e medição de custo por consulta. **Aceite:** fonte liga por config, custo por usuário visível no admin, **nunca scraping**.' },
    { titulo: 'Pacote C · Parceiros, rede e KPIs', corpo: 'Botão "pagar com parceiro" após diagnóstico válido, com tracking de comissão · rede de prestadores com verificação de credencial · dívida ativa por UF · KPIs v2 no painel (ativação, free»paid, churn D30/90, CAC, custo de consulta).' }
  ], 2, { y: d.y + 4, tamanhoCorpo: 9 });
  d.nota('Ordem dos pacotes: A » B » C · nenhum item do C sem papel assinado da fonte de dados.');

  d.folha({ eyebrow: 'parte 5 · segurança e lgpd', titulo: 'O que é inegociável' });
  d.cartoes([
    { titulo: 'Criptografia e segredos', corpo: 'TLS em trânsito · senhas bcrypt · **nenhum segredo no código**, só variável de ambiente, com o processo abortando em produção se faltar. Dados sensíveis cifrados em repouso quando migrar para Postgres.' },
    { titulo: 'LGPD por design', corpo: 'Consentimento **inequívoco e gravado** no cadastro (art. 8º §2º) · minimização · direitos do titular como endpoints (`/v1/eu/dados`, `/v1/eu/conta`) · retenção do histórico de pagamento por obrigação fiscal, sem vínculo com pessoa identificável · RIPD quando ligar dado oficial.' },
    { titulo: 'Acesso', corpo: 'Menor privilégio · MFA no admin (pendente) · trilha de auditoria imutável de consultas e alterações · logs **sem** dados pessoais.' },
    { titulo: 'Linhas vermelhas', corpo: '**Nunca** prometer cancelamento · **nunca** inventar multa (`DEMO_NOVA_MULTA` proibido em produção) · **nunca** scraping de portal governamental · estimativa sempre com escudo e **sempre abaixo de 100%**.' }
  ], 2, { y: d.y + 4, tamanhoCorpo: 9 });

  d.folha({ eyebrow: 'parte 6 · jeito de trabalhar e definition of done', titulo: 'Como esta equipe entrega' });
  d.cartoes([
    { titulo: 'Fluxo', corpo: 'Repositório privado · branch por tarefa · PR revisado obrigatório · CI com `npm test` + lint · deploy de staging automático, produção por aprovação · migrations versionadas no PR.' },
    { titulo: 'Definition of Done', corpo: '`npm test` verde · estados vazio/carregando/erro em toda tela · sem dado sensível em log · escudo presente onde há estimativa · **README e os manuais atualizados no mesmo PR** · aprovado em staging.' },
    { titulo: 'A regra que este projeto aprendeu', corpo: 'Os manuais viveram fora do repositório e envelheceram em silêncio: chegaram a mandar cadastrar um webhook que respondia 404 e a vender um plano que o checkout recusava. **Agora os manuais são gerados por código** (`ferramentas/`), no mesmo commit da mudança.', destaque: true },
    { titulo: 'Cadência', corpo: 'Sprints semanais com demo gravada · board único · relatório de sexta (feito, bloqueios, próximos) · acesso do dono ao painel de KPIs sempre. O dev não decide estratégia — executa esta pauta.' }
  ], 2, { y: d.y + 4, tamanhoCorpo: 9 });

  d.folha({ eyebrow: 'parte 7 · resumo executivo para a proposta', titulo: 'O pedido em uma página (copie no e-mail)' });
  d.faixa('"Temos uma plataforma SaaS **funcionando e testada de ponta a ponta** (Node/Express + PWA + Mercado Pago + OCR Vision), com deploy de 1 clique no Render, suíte de 56 asserções e documentação gerada por código. Contratamos: **PACOTE A** — o que falta de blindagem: MFA no admin, backup com restore testado, observabilidade com reprocesso de webhook, teste de carga e CI obrigatório (1–2 semanas); **PACOTE B** — publicação na Google Play via TWA + Web Push (2 semanas); **PACOTE C** — integrações sob demanda (Data Gateway Serpro, pagamento-parceiro, rede credenciada), por frente contratada. Exigimos: contrato com cessão de PI + NDA, PRs revisados, CI verde, staging antes de produção, e respeito absoluto às linhas vermelhas do produto (sem promessa de resultado, sem simulação de dados em produção, sem scraping). Envie proposta **por pacote**, com prazo, equipe e valor."', { cor: COR.placa, fundo: '#EDF2FA' });
  d.nota('Critério de seleção: (1) já publicou app com pagamento recorrente · (2) mostra testes em projetos anteriores · (3) aceita cessão de PI sem drama · (4) fala simples. Quem falhar em 2 dos 4, não passa. Kit de envio: este PDF + acesso leitor ao repositório.');

  d.capa({
    fecho: true,
    eyebrow: 'a régua',
    titulo: ['Bilionário não nasce do código —', 'nasce da disciplina em cima dele.', '~Produto no ar · gates cumpridos · dados próprios.'],
    subtitulo: 'Este kit garante que qualquer equipe pegue o Verimulta e o leve adiante do jeito certo — com a PrimeCorp dona de cada linha. Verifica, Brasil.'
  });
  return d.gravar();
}

// ---------------------------------------------------------------- 3
async function cronogramaGoLive(arquivo) {
  const d = new Deck({ arquivo, rodape: `VERIMULTA · ${RODAPE}` });

  d.capa({
    eyebrow: 'plano de execução · go-live',
    titulo: ['Cronograma da Chegada', '~4 semanas até o Dia D'],
    subtitulo: 'A construção acabou — sistema, marca, jurídico-modelo, marketing e lojas estão prontos, e o funil inteiro passou na bateria de testes. O que resta é operação: contas, chaves e protocolos. Este é o mapa, semana a semana.'
  });

  d.folha({ eyebrow: 'as 4 semanas', titulo: 'Semana a semana, sem enrolação' });
  d.passos([
    { titulo: 'SEMANA 1 · PROTEGER — INPI + contador + servidor', corpo: '(1) Protocolar a marca **VERIMULTA** no e-Marcas (classes **42 e 45**, arquivo 945×945 na pasta LOGOMARCA — GRU R$ 440/classe ME/EPP). (2) Enviar as anotações ao contador: CNAE **62.02-3/00** + NFS-e. (3) Subir o sistema no Render (Blueprint de 1 clique), **conferir o disco persistente** e apontar o domínio.' },
    { titulo: 'SEMANA 2 · LIGAR AS CHAVES — dinheiro, e-mail e OCR', corpo: `(1) Conta Mercado Pago PJ » Access Token + webhook em \`${WEBHOOK}\` com a assinatura secreta em \`WEBHOOK_SECRET\`. (2) Criar \`contato@verimulta.com.br\` » 5 variáveis SMTP » e-mails reais. (3) Chave Google Vision » OCR ao vivo. (4) Advogado(a): revisão dos Termos e da Privacidade.` },
    { titulo: 'SEMANA 3 · PROVAR — beta fechado com 20 usuários reais', corpo: 'Convidar 20 motoristas. Meta: 20 cadastros, 10 multas auditadas, 3 assinaturas de fundador e **desfechos registrados** para calibrar a jurimetria. Ajustar o que o beta apontar.' },
    { titulo: 'SEMANA 4 · ESTOURAR — Dia D, lançamento público', corpo: 'Rodar o calendário D-7 » Dia D: mistério » dor » prova » contagem » estouro às 9h em todos os canais, oferta de fundador (500 primeiros, preço travado). Google Ads em "recorrer multa" + posts prontos. Painel do Dono aberto, acompanhando o MRR ao vivo.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.2 });
  d.nota('Depois do Dia D: PWABuilder » Google Play (US$ 25) · credenciamentos SENATRAN/Detran · primeiros parceiros da rede.');

  d.folha({ eyebrow: 'checklist mestre', titulo: 'Ticando: pronto × pendente' });
  d.listas({
    y: d.y,
    esquerda: {
      titulo: 'Construído e testado', cor: COR.ok, marcado: true, itens: [
        'API completa: auth, veículos, multas, diagnóstico, defesas',
        'Motor A1–A14 + jurimetria v2 com teto e correlação',
        'OCR/extrator + pagamentos com webhook + e-mails com dedup',
        'Monitoramento de prazos (varredura diária + alerta)',
        'App conectado + **PDF timbrado gerado no servidor**',
        'Site com planos corretos + Painel do Dono com MRR',
        'LGPD: consentimento gravado, exportação e exclusão de conta',
        'Segurança: rate limit, CORS por allowlist, upload validado',
        '**56 asserções automatizadas, 0 falhas**'
      ]
    },
    direita: {
      titulo: 'Operação (as chaves do reino)', cor: COR.placa, marcado: false, itens: [
        '**INPI:** depositar a marca nas classes 42+45 (prioridade nº 1)',
        '**Contador:** CNAE 62.02-3/00 + NFS-e',
        '**Render:** subir, conferir o **disco persistente** e apontar o domínio',
        '**Mercado Pago:** token + webhook + assinatura secreta',
        '**E-mail:** `contato@` + 5 variáveis SMTP',
        '**Google Vision:** chave do OCR',
        '**Advogado(a):** carimbo final nos Termos e na Privacidade',
        '**Pendências técnicas:** MFA no admin, backup, observabilidade',
        '**Beta:** 20 usuários » calibrar » Dia D'
      ]
    }
  });
  d.nota('Verifica, Brasil.');

  return d.gravar();
}

// ---------------------------------------------------------------- 4
/**
 * Termo de participação no beta fechado.
 * MODELO — precisa do carimbo do advogado antes de ir para os participantes.
 * O que este documento faz é garantir que ninguém entre no teste sem saber o
 * que o app faz, o que ele ainda NÃO faz, e o que acontece com os dados dele.
 */
async function termoBeta(arquivo) {
  const d = new Deck({ arquivo, rodape: `TERMO DE PARTICIPAÇÃO — BETA FECHADO · ${RODAPE}` });

  d.capa({
    eyebrow: 'beta fechado · convite e termo de participação',
    titulo: ['Você foi convidado', '~para testar o Verimulta'],
    subtitulo: 'Um teste fechado de 30 a 40 dias, gratuito, com um grupo pequeno de motoristas. Este documento explica em linguagem direta o que o aplicativo faz hoje, **o que ele ainda não faz**, e o que acontece com os seus dados. Leia antes de aceitar.'
  });

  d.folha({ eyebrow: 'parte 1 · o que o aplicativo faz hoje', titulo: 'O que você pode esperar — e o que não pode' });
  d.cartoes([
    { titulo: 'O que já funciona', corpo: 'Você fotografa a **notificação de autuação** que recebeu. O app lê o documento, roda **14 verificações** com a base legal de cada uma (CTB, resoluções do CONTRAN, portaria do INMETRO), mostra um **Índice de Consistência** e monta a **Defesa Prévia em PDF** no seu nome, para você revisar e protocolar. Também soma os **pontos** das multas que você cadastrar e avisa dos **prazos**.' },
    { titulo: 'O que ainda NÃO funciona', corpo: 'O app **não consulta o Detran**. Ele não sabe o seu IPVA, o seu licenciamento, recall, dívida ativa, nem a sua pontuação oficial. O acesso a essas bases depende de credenciamento junto ao SENATRAN, que está em andamento. **Enquanto isso o app não mostra esses dados** — e avisa, em cada tela, que não consultou.', destaque: true }
  ], 2, { y: d.y + 4 });
  d.faixa('**O Verimulta não garante o cancelamento de multa nenhuma.** As probabilidades que aparecem na tela são estimativas calculadas a partir das verificações do documento — nunca promessa de resultado. Quem decide sobre a autuação é exclusivamente o órgão julgador. Qualquer pessoa que disser o contrário não está falando pela PrimeCorp.', { y: d.y + 2, cor: COR.alerta, fundo: '#FDECEA' });

  d.folha({ eyebrow: 'parte 2 · seus dados', titulo: 'O que coletamos, por quê, e como você sai' });
  d.tabela({
    colunas: ['Dado', 'Para que serve', 'Você pode'],
    larguras: [1, 2, 1],
    tamanho: 9,
    respiro: 11,
    linhas: [
      ['Nome e e-mail', 'Identificar sua conta e enviar os avisos de prazo.', 'exportar e excluir'],
      ['CPF (opcional)', 'Preencher a Defesa Prévia no seu nome. Pode ficar em branco.', 'deixar em branco'],
      ['Placa do veículo', 'Vincular a multa ao veículo e montar a defesa.', 'exportar e excluir'],
      ['Foto ou texto da notificação', 'Ler os campos do auto e rodar as 14 verificações.', 'exportar e excluir'],
      ['Validade da CNH (opcional)', 'Avisar você antes de vencer. Informada por você.', 'deixar em branco'],
      ['Seu feedback do teste', 'Corrigir o que estiver ruim durante o beta.', 'ver o que enviou']
    ],
    y: d.y + 2
  });
  d.cartoes([
    { titulo: 'Base legal e prazo', corpo: 'O tratamento acontece com **o seu consentimento** (LGPD, art. 7º, I), que você dá ao criar a conta e pode retirar quando quiser. Os dados do teste são mantidos enquanto durar o beta e enquanto a conta existir.' },
    { titulo: 'Como sair a qualquer momento', corpo: 'No app: **Meu perfil » Excluir minha conta**. Veículos, multas, diagnósticos e defesas são apagados na hora. O registro de pagamento, quando houver, é mantido sem vínculo com pessoa identificável, por obrigação fiscal. Antes de sair, use **Baixar meus dados** para levar tudo com você.' }
  ], 2, { y: d.y + 6, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'parte 3 · combinado', titulo: 'O que se espera de cada lado' });
  d.cartoes([
    { titulo: 'Da nossa parte', corpo: '(1) Nenhuma cobrança durante o teste. (2) Responder ao que você relatar. (3) Não usar seus dados para outra finalidade nem repassar a terceiros. (4) Avisar antes de qualquer mudança que afete você. (5) Dizer sempre o que o app não sabe, em vez de inventar.' },
    { titulo: 'Da sua parte', corpo: '(1) Usar com documentos reais seus. (2) **Conferir o prazo no documento oficial** antes de contar com o aviso do app — ele é apoio, não substitui a notificação. (3) Revisar a defesa antes de protocolar: ela sai no seu nome e quem protocola é você. (4) Relatar o que der errado pelo canal do app.' },
    { titulo: 'O que NÃO testar', corpo: 'Não é preciso pagar nada. Se aparecer tela de assinatura, ela está em **modo demonstração** e nenhum valor é cobrado. Não envie senha, número de cartão ou documento de outra pessoa pelo campo de feedback.', destaque: true },
    { titulo: 'Contato', corpo: 'Dúvida, problema ou vontade de sair do teste: **contato@verimulta.com.br**. O canal de feedback dentro do app chega direto em quem desenvolve.' }
  ], 2, { y: d.y + 2, tamanhoCorpo: 9.2 });

  d.folha({ eyebrow: 'aceite', titulo: 'Declaração do participante' });
  d.faixa('Declaro que li este documento, que entendi que o **Verimulta não garante o cancelamento de multas**, que **as consultas às bases oficiais do Detran ainda não estão ligadas**, e que autorizo o tratamento dos meus dados para as finalidades descritas na Parte 2, podendo retirar o consentimento a qualquer momento pelo próprio aplicativo.', { cor: COR.placa, fundo: '#EDF2FA' });
  d.y += 14;
  d.tabela({
    colunas: ['Campo', 'Preencher'],
    larguras: [1, 2.6],
    tamanho: 9.5,
    respiro: 22,
    zebra: false,
    linhas: [
      ['Nome completo', ' '],
      ['E-mail usado no app', ' '],
      ['Data', ' '],
      ['Assinatura', ' ']
    ],
    y: d.y
  });
  d.nota('Aceite eletrônico também vale: responder ao convite por e-mail ou WhatsApp confirmando a leitura tem o mesmo efeito (MP 2.200-2/2001 e Lei 14.063/2020). Guarde uma cópia. · **Modelo sujeito a revisão jurídica antes da distribuição.**');

  d.capa({
    fecho: true,
    eyebrow: 'obrigado por testar',
    titulo: ['Seu relato é o que faz', '~o produto melhorar.'],
    subtitulo: 'Cada coisa que te atrapalhar aqui é uma coisa a menos para atrapalhar quem vier depois. Verifica, Brasil.'
  });
  return d.gravar();
}

// ---------------------------------------------------------------- 5
/** Roteiro do que pedir aos testadores — e do que observar no painel. */
async function roteiroBeta(arquivo) {
  const d = new Deck({ arquivo, rodape: `ROTEIRO DO BETA · ${RODAPE}` });

  d.capa({
    eyebrow: 'beta fechado · roteiro de teste',
    titulo: ['O que pedir aos 30', '~e o que observar'],
    subtitulo: 'Um beta sem roteiro vira "achei legal". Este documento traz as tarefas que cada participante deve executar, o que anotar, e o que você acompanha do lado de cá no Painel do Dono.'
  });

  d.folha({ eyebrow: 'para o participante · 20 minutos', titulo: 'As 8 tarefas do teste' });
  d.passos([
    { titulo: '1. Instalar no celular', corpo: 'Abrir o endereço que você recebeu, e instalar pelo navegador (**Android:** três pontinhos » Instalar aplicativo · **iPhone:** Compartilhar » Adicionar à Tela de Início). **Anote:** funcionou de primeira?' },
    { titulo: '2. Criar a conta', corpo: 'Nome, e-mail, senha e o aceite dos Termos. **Anote:** faltou alguma informação? O aceite ficou claro?' },
    { titulo: '3. Cadastrar o veículo', corpo: 'Informar a placa. **Anote:** achou onde fazer isso sem ajuda?' },
    { titulo: '4. Verificar uma multa real', corpo: 'Fotografar a notificação — ou tocar em **Digitar os dados à mão**, que funciona igual. O app mostra os campos lidos para você **conferir e corrigir** antes de rodar a auditoria. **Anote:** que campo veio errado ou vazio? A tela de conferência ficou clara? (este é o teste mais importante)' },
  ], { y: d.y + 2, tamanhoCorpo: 9.2 });

  d.folha({ eyebrow: 'para o participante · 20 minutos', titulo: 'As 8 tarefas do teste (continuação)' });
  d.passos([
    { titulo: '5. Ler o diagnóstico', corpo: 'Ver o **Índice de Consistência** e as 14 verificações. **Anote:** deu para entender o que significa? Alguém achou que era garantia de cancelamento?' },
    { titulo: '6. Gerar a Defesa Prévia', corpo: 'Assinar no modo demonstração (não é cobrado) e emitir a defesa em PDF. **Anote:** o PDF abriu? O texto fez sentido? Você protocolaria?' },
    { titulo: '7. Conferir os pontos da CNH', corpo: 'Ver a pontuação somada e informar a validade da habilitação. **Anote:** o número bateu com o que você sabe?' },
    { titulo: '8. Mandar o feedback', corpo: 'Perfil » **Enviar feedback do beta**. Uma nota de 1 a 5 e o que atrapalhou. **É a tarefa que não pode faltar.**', cor: COR.sinal }
  ], { y: d.y + 2, tamanhoCorpo: 9.2 });

  d.folha({ eyebrow: 'para você · painel do dono', titulo: 'O que acompanhar durante os 30 dias' });
  d.tabela({
    colunas: ['Indicador', 'Onde ver', 'O que significa'],
    larguras: [1.1, 1, 2],
    tamanho: 9,
    respiro: 11,
    linhas: [
      ['Ativação', 'Últimos usuários', 'Quantos dos 30 criaram conta. Abaixo de 20, o problema está no convite ou na instalação.'],
      ['Primeira auditoria', 'Últimas multas', 'Quantos chegaram a escanear uma multa. É o momento de verdade do produto.'],
      ['Qualidade da leitura', 'Feedback, tarefa 4', 'Campo lido errado é o defeito mais caro. A tela de conferência segura o erro antes da defesa — veja quantos campos as pessoas precisaram corrigir.'],
      ['Entendimento', 'Feedback, tarefa 5', 'Alguém confundiu o Índice com garantia? Se acontecer mais de uma vez, a interface precisa mudar.'],
      ['Nota média', 'Feedback do beta', 'Abaixo de 3, pare a divulgação e corrija antes de abrir para mais gente.'],
      ['Relatos por tela', 'Feedback do beta', 'A tela mais citada é a que mais atrapalha. Comece por ela.']
    ],
    y: d.y + 2
  });
  d.nota('O Painel do Dono abre em `/admin.html` com a sua chave. O bloco **Feedback do beta** mostra tudo o que chegou, com nota média e a tela mais citada.');

  d.folha({ eyebrow: 'combinado com o grupo', titulo: 'Como conduzir para o teste render' });
  d.cartoes([
    { titulo: 'Convide em levas', corpo: 'Comece com **5 pessoas**. Corrija o que elas apontarem. Só então chame as outras 25. Trinta relatos do mesmo defeito não valem mais do que um — e queimam trinta convites.' },
    { titulo: 'Peça o print do erro', corpo: 'Relato sem contexto não vira correção. Oriente: print da tela + o que estava fazendo antes. O feedback do app já registra a tela e a versão automaticamente.' },
    { titulo: 'Combine o prazo', corpo: 'Diga que o teste dura de 30 a 40 dias e que você vai voltar a falar com cada um. Quem sabe que será ouvido relata; quem acha que fala no vazio desiste na primeira semana.' },
    { titulo: 'Não prometa resultado', corpo: 'Nem a você mesmo. O produto entrega **verificação e defesa organizada**, não cancelamento. Se alguém entrar no teste esperando anular a multa, a frustração dele não é defeito do app — é da promessa.', destaque: true }
  ], 2, { y: d.y + 2, tamanhoCorpo: 9.2 });

  d.capa({
    fecho: true,
    eyebrow: 'depois dos 30 dias',
    titulo: ['Corrigiu o que o beta apontou?', '~Então pode abrir para o Brasil.'],
    subtitulo: 'Os critérios de liberação estão no Guia de Ativação: Checklist de Homologação de 20 itens, mais as chaves de produção ligadas. Verifica, Brasil.'
  });
  return d.gravar();
}

module.exports = { guiaDeAtivacao, handoffDesenvolvedor, cronogramaGoLive, termoBeta, roteiroBeta };
