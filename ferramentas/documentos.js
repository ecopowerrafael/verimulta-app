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
async function planoDeAtivacao(arquivo) {
  const d = new Deck({ arquivo, rodape: RODAPE });

  d.capa({
    eyebrow: 'plano de ativação · do seu dell ao primeiro pagamento',
    titulo: ['Ligar o Verimulta', '~e Começar a Vender'],
    subtitulo: 'O caminho completo em 7 fases, escrito para **VOCÊ** executar sozinho: teste no PC, servidor no ar, domínio, dinheiro entrando pelo Mercado Pago, e-mails, conferência final e a largada das vendas. Com o Rascunho de Chaves para anotar cada valor no lugar certo.'
  });

  d.folha({ eyebrow: 'antes de tudo · as duas dúvidas de sempre', titulo: '"Failed to fetch" e a Chave do Administrador' });
  d.faixa('**O diagnóstico:** o Painel do Dono (`admin.html`) precisa conversar com a API. Se você abrir o arquivo com um duplo clique, sem servidor rodando, ele diz "Failed to fetch". **Nada está quebrado** — falta ligar o motor (Fase 1 ou Fase 2).');
  d.cartoes([
    { titulo: 'A Chave do Administrador', corpo: 'É a variável `ADMIN_SECRET`. **No Render você não precisa inventar nada:** o Blueprint gera um valor aleatório sozinho — copie em Environment quando quiser entrar no painel. Rodando no seu PC, você define a chave na hora de ligar o servidor. Não existe chave de fábrica, e isso é segurança.' },
    { titulo: 'Por que o sistema aborta sem as chaves', corpo: 'Com `NODE_ENV=production`, o servidor **se recusa a subir** sem `JWT_SECRET`, `ADMIN_SECRET` e `WEBHOOK_SECRET`, e diz no log quais faltam. É proposital: um deploy silenciosamente inseguro é pior que um deploy que não sobe.' }
  ], 2, { y: d.y + 4 });
  d.nota('Quer ver o painel funcionando agora, no seu Dell? Fase 1 — 15 minutos.');

  d.folha({ eyebrow: 'fase 1 · teste completo no seu pc (15 min)', titulo: 'Ligar o sistema no Dell' });
  d.passos([
    { titulo: '1. Instale o Node.js', corpo: '`nodejs.org` » baixe a versão **LTS** (22, 23 ou 24 servem) » instale com Avançar-Avançar-Concluir.' },
    { titulo: '2. Abra a pasta do sistema no terminal', corpo: 'Entre em `6_CODIGO_FONTE/sistema` no Explorer » clique na barra de endereço » digite `powershell` e Enter.' },
    { titulo: '3. Instale as dependências (só na 1ª vez)', corpo: 'Digite `npm install` e aguarde terminar.' },
    { titulo: '4. Confira que está tudo são', corpo: 'Digite `npm test`. Devem passar **56 asserções, 0 falhas** — motor de auditoria, extrator de OCR, grade de planos e o funil inteiro por HTTP. Se falhar alguma, não suba: me chame com o print.' },
    { titulo: '5. Ligue o servidor e use o sistema', corpo: 'Digite `$env:ADMIN_SECRET="SuaChaveAqui"; node servidor.js` » abra `http://localhost:3000/app.html` (o app) e `http://localhost:3000/admin.html` (o painel, com a chave que você criou). Crie uma conta, escaneie a multa-exemplo, assine no modo demonstração e gere a defesa. **Tudo funcionando = pronto para o mundo.** Para desligar: Ctrl+C.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'fase 2 · servidor no ar (render.com · ~40 min)', titulo: 'Colocar na internet de verdade' });
  d.passos([
    { titulo: '1. GitHub', corpo: '`github.com` » Sign up » **New repository** `verimulta` (**Private**) » "uploading an existing file" » arraste **o conteúdo** da pasta `sistema` (o `servidor.js` tem de ficar na raiz) » Commit.' },
    { titulo: '2. Render », Blueprint', corpo: '`render.com` » Sign up with GitHub » **New +** » **Blueprint** » repositório `verimulta` » **Apply**. O `render.yaml` monta o serviço, cria o **disco persistente** e gera `JWT_SECRET` e `ADMIN_SECRET` sozinho.' },
    { titulo: '3. O disco é obrigatório — confira', corpo: 'Em **Settings » Disks** tem de existir um disco montado em `/var/data`, e em Environment `DB_PATH` = `/var/data/verimulta.db`. **Sem isso, cada novo deploy apaga todos os usuários, multas, defesas e o histórico de pagamento.** O Blueprint já faz; confira mesmo assim.', cor: COR.alerta },
    { titulo: '4. Prova de vida', corpo: 'Espere o deploy ficar **Live** (bolinha verde) » abra `verimulta.onrender.com/app.html` no celular. Sistema na internet.' },
    { titulo: '5. Domínio próprio', corpo: 'Render » **Settings » Custom Domains** » adicione `www.verimulta.com.br` » copie o destino CNAME. No provedor do domínio (Registro.br ou Locaweb) » Editar Zona DNS » registro **CNAME** `www` apontando para o destino » salvar. O cadeado (SSL) ativa sozinho em até 1h.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });
  d.nota('Plano do Render: **Starter (US$ 7/mês)** desde o beta pago. O Free hiberna, e um serviço hibernado pode perder a notificação de pagamento do Mercado Pago.');

  d.folha({ eyebrow: 'fase 3 · o dinheiro (mercado pago · ~30 min)', titulo: 'Cliente paga » acesso libera sozinho' });
  d.passos([
    { titulo: '1. Conta PJ', corpo: '`mercadopago.com.br` » criar conta com o CNPJ da PrimeCorp (**55.745.297/0001-06**) » validar documentos e cadastrar a conta bancária de saque.' },
    { titulo: '2. Credencial de produção', corpo: '`mercadopago.com.br/developers` » Suas integrações » Criar aplicação "Verimulta" » **Credenciais de produção** » copie o **Access Token** (`APP_USR-...`) » no Render: `MP_ACCESS_TOKEN` = o token e `GATEWAY` = `mercadopago`.' },
    { titulo: '3. Webhook — o endereço exato', corpo: `Na aplicação » **Webhooks** » modo Produção » URL: \`${WEBHOOK}\` » eventos de **Pagamentos** e **Assinaturas (preapproval)** » Salvar » copie a **assinatura secreta** » no Render: \`WEBHOOK_SECRET\` = essa assinatura.` },
    { titulo: '4. O teste de fogo', corpo: 'Assine você mesmo o **Combo 01 (R$ 29,90)** com o seu cartão » o badge vira **PLANO ATIVO** em até 1 minuto » confira o pagamento na trilha do Painel do Dono » cancele em 1 toque. **Ciclo validado nos dois sentidos = caixa aberto.**' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });
  d.faixa('`WEBHOOK_SECRET` tem de ser **a assinatura secreta que o painel do Mercado Pago mostra**, não um valor inventado. Com um valor qualquer, toda notificação é recusada com 401: o cliente paga e o plano nunca libera — sem erro visível em lugar nenhum.', { y: d.y + 2, cor: COR.alerta, fundo: '#FDECEA' });

  d.folha({ eyebrow: 'fases 4, 5 e 6 · e-mail, ocr e a conferência final', titulo: 'Os últimos parafusos' });
  d.passos([
    { titulo: 'Fase 4 · E-mail oficial (Zoho grátis ou Locaweb · 20 min)', corpo: '`zoho.com/mail` » plano Forever Free » adicionar o domínio » cadastrar os registros TXT/MX na Zona DNS » criar `contato@verimulta.com.br` » gerar **senha de aplicativo** » no Render: `SMTP_HOST`=`smtp.zoho.com`, `SMTP_PORT`=`465`, `SMTP_USER`, `SMTP_PASS` e `EMAIL_FROM`=`Verimulta <contato@verimulta.com.br>`. Teste: crie uma conta no app e veja o e-mail de boas-vindas chegar.' },
    { titulo: 'Fase 5 · OCR das fotos (Google Vision · 15 min)', corpo: '`console.cloud.google.com` » novo projeto "verimulta" » ativar a **Cloud Vision API** » Credenciais » Criar chave de API » no Render: `GOOGLE_VISION_KEY`. São 1.000 leituras/mês grátis — sobra para o beta. Sem a chave, o app segue funcionando com preenchimento manual.' },
    { titulo: 'Fase 6 · Conferência de fumaça (10 min)', corpo: '(1) site abre no domínio com cadeado · (2) cadastro **exige o aceite** dos Termos e dispara e-mail · (3) scan lê a foto · (4) paywall trava a probabilidade no grátis · (5) pagamento real ativa o plano em < 1 min · (6) Defesa e Extrato saem em **PDF timbrado** · (7) painel mostra o MRR certo · (8) Termos e Privacidade abrem · (9) contador confirmou CNAE + NFS-e · (10) advogado carimbou os Termos. **10 de 10 = pode vender.**' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

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

  d.capa({
    fecho: true,
    eyebrow: 'fase 7 · vender',
    titulo: ['Sistema no ar + caixa aberto =', 'beta de 20 » Instagram no ritmo »', '~R$ 35/dia » Dia D com oferta de fundador.'],
    subtitulo: 'Tudo o que essa página resume já está pronto nas outras pastas: feed de 37 posts, campanhas, projeções e cronograma. Você liga as chaves — o resto já foi construído. Chegou quem verifica.'
  });
  return d.gravar();
}

// ---------------------------------------------------------------- 2
async function manualInstalacao(arquivo) {
  const d = new Deck({ arquivo, rodape: `VERIMULTA · ${RODAPE}` });

  d.capa({
    eyebrow: 'manual de instalação · www.verimulta.com.br',
    titulo: ['Do ZIP ao AR:', 'o site hospedado e', '~o caixa recebendo'],
    subtitulo: 'Cada clique, na ordem, sem pular etapa: GitHub » Render » domínio » Mercado Pago com entrega automática de acesso por plano » e-mail » OCR » teste de fogo. Ao fim deste manual o cliente paga e recebe o acesso sozinho — você só acompanha o MRR subir no Painel do Dono.'
  });

  d.folha({ eyebrow: 'etapa 1 · o código na nuvem (github · 15 min)', titulo: 'Suba o sistema para o GitHub' });
  d.passos([
    { titulo: '1.', corpo: 'Acesse `github.com` » **Sign up** » crie a conta com o e-mail da empresa e confirme.' },
    { titulo: '2.', corpo: 'Canto superior direito **+** » **New repository** » Nome: `verimulta` » marque **Private** » **Create repository**.' },
    { titulo: '3.', corpo: 'Na tela do repositório, clique em **"uploading an existing file"** » abra a pasta `6_CODIGO_FONTE/sistema` no seu PC » selecione **todo o conteúdo de dentro dela** (Ctrl+A) e arraste para o navegador.' },
    { titulo: '4.', corpo: 'Aguarde o upload » clique **Commit changes**. Código na nuvem. *Importante: arraste o **conteúdo** da pasta, não a pasta — o `servidor.js` tem de aparecer na raiz do repositório.*' }
  ], { y: d.y + 6 });
  d.nota('O repositório privado protege o seu código. A `.gitignore` já impede que banco, `node_modules` e segredos subam junto.');

  d.folha({ eyebrow: 'etapa 2 · o servidor (render · 20 min)', titulo: 'Ligue o sistema com 1 Blueprint' });
  d.passos([
    { titulo: '1.', corpo: '`render.com` » **Sign up with GitHub** » autorize o acesso ao repositório `verimulta`.' },
    { titulo: '2.', corpo: 'Painel » **New +** » **Blueprint** » selecione `verimulta` » o Render lê o `render.yaml` e monta tudo » **Apply**.' },
    { titulo: '3. Confira o disco antes de seguir', corpo: '**Settings » Disks**: tem de existir um disco de 1 GB montado em `/var/data`, e `DB_PATH` = `/var/data/verimulta.db` em Environment. **Sem o disco, cada deploy zera a base inteira** — usuários, multas, defesas e pagamentos.', cor: COR.alerta },
    { titulo: '4.', corpo: '`JWT_SECRET` e `ADMIN_SECRET` o Render **gera sozinho**. Você só preenche depois as chaves do dinheiro, do e-mail e do OCR (etapas 3, 5 e 6).' },
    { titulo: '5.', corpo: 'Espere o deploy ficar **Live** » teste `verimulta.onrender.com/app.html` no celular. Depois: **Settings » Custom Domains** » `www.verimulta.com.br` » copie o CNAME » cadastre na Zona DNS do seu provedor. SSL automático em até 1h.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'etapa 3 · o caixa (mercado pago · 30 min)', titulo: 'Configurar o recebimento' });
  d.passos([
    { titulo: '1. Conta PJ', corpo: '`mercadopago.com.br` » Criar conta » CNPJ **55.745.297/0001-06** (PrimeCorp Brokers) » envie os documentos e cadastre a conta bancária onde o dinheiro vai cair.' },
    { titulo: '2. Credencial de produção', corpo: 'Logado » `mercadopago.com.br/developers` » **Suas integrações » Criar aplicação** » nome "Verimulta" » modelo **Pagamentos on-line / Assinaturas** » **Credenciais de produção** » copie o **Access Token** (`APP_USR-...`) » no Render: `GATEWAY`=`mercadopago` e `MP_ACCESS_TOKEN`= o token.' },
    { titulo: '3. Webhook (a entrega automática)', corpo: `Na aplicação » **Webhooks / Notificações** » Modo produção » URL: \`${WEBHOOK}\` » marque **Pagamentos** e **Assinaturas (preapproval)** » Salvar » copie a **Assinatura secreta** » Render: \`WEBHOOK_SECRET\` = a assinatura. Salvou = redeploy automático.` }
  ], { y: d.y + 4 });
  d.faixa('**Confira o endereço do webhook caractere por caractere.** É `/v1/webhooks/mercadopago`. Um endereço errado devolve 404, o Mercado Pago reenfileira a notificação em silêncio, e o cliente fica pagando sem receber o plano.', { y: d.y + 2, cor: COR.alerta, fundo: '#FDECEA' });

  d.folha({ eyebrow: 'etapa 4 · como a entrega de acesso funciona', titulo: 'Cliente pagou » plano liberado. Sozinho.' });
  d.faixa('**O ciclo automático, em 6 batidas:** (1) o cliente toca "Assinar" » (2) o servidor cria a assinatura recorrente no MP e o cliente paga no checkout » (3) o MP dispara o webhook » (4) o servidor **valida a assinatura criptográfica** e **reconsulta o status real** no MP » (5) aprovado = o plano grava no usuário e os limites liberam na hora » (6) o e-mail de confirmação dispara e o Painel do Dono soma o MRR. **Zero toque seu.**');
  d.tabela({
    colunas: ['Plano pago', 'O que libera automaticamente'],
    larguras: [0.75, 3],
    tamanho: 9.2,
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

  d.folha({ eyebrow: 'etapas 5 e 6 · e-mail e ocr', titulo: 'As últimas duas chaves' });
  d.passos([
    { titulo: '5. E-mail `contato@verimulta.com.br` (Zoho grátis · 20 min)', corpo: '`zoho.com/mail` » **Forever Free** » adicionar domínio `verimulta.com.br` » o Zoho mostra 2 registros (TXT de verificação + MX) » cadastre ambos na Zona DNS » crie a caixa `contato@` » em Segurança, gere uma **Senha de aplicativo** » no Render: `SMTP_HOST`=`smtp.zoho.com` · `SMTP_PORT`=`465` · `SMTP_USER`=`contato@verimulta.com.br` · `SMTP_PASS`=[senha de app] · `EMAIL_FROM`=`Verimulta <contato@verimulta.com.br>`.' },
    { titulo: '6. OCR das fotos (Google Vision · 15 min)', corpo: '`console.cloud.google.com` » novo projeto "verimulta" » APIs e serviços » Biblioteca » **Cloud Vision API » Ativar** » Credenciais » Criar credencial » **Chave de API** » Render: `GOOGLE_VISION_KEY`. São 1.000 leituras/mês grátis.' },
    { titulo: 'Monitoramento em produção', corpo: '`FONTES_MONITORAMENTO`=`demo` e **jamais** defina `DEMO_NOVA_MULTA` em produção — a regra da casa é nunca inventar multa. Os alertas de prazo funcionam desde o dia 1; a varredura de novos débitos expande com os convênios oficiais.', cor: COR.alerta }
  ], { y: d.y + 4 });

  d.folha({ eyebrow: 'etapa 7 · o teste de fogo', titulo: 'A venda-piloto que autoriza o lançamento' });
  d.passos([
    { titulo: '1.', corpo: 'No celular, acesse `www.verimulta.com.br` » crie uma conta real com o **seu** e-mail » **marque o aceite dos Termos** (sem ele o cadastro não conclui — é exigência da LGPD) » confira o e-mail de boas-vindas chegando.' },
    { titulo: '2.', corpo: 'Fotografe uma notificação real » veja o OCR preencher » abra o diagnóstico » confirme o **Índice de Consistência** na manchete e o paywall travando a probabilidade.' },
    { titulo: '3.', corpo: 'Assine o **Combo 01 (R$ 29,90)** com o seu próprio cartão » conclua no checkout do MP » volte ao app » o badge deve virar **PLANO ATIVO** em até 1 minuto (o webhook trabalhando).' },
    { titulo: '4.', corpo: 'Gere a **Defesa Prévia** » **Emitir em PDF** » confira o timbre (o PDF vem do servidor, não da impressora do navegador) » gere também o **Extrato de Auditoria**. Abra `/admin.html` com a sua chave » veja o pagamento na trilha e **MRR = R$ 29,90**.' },
    { titulo: '5.', corpo: 'Cancele em 1 toque no perfil » confirme o cancelamento refletindo no MP. **Ciclo completo validado nos dois sentidos = pode vender para o Brasil.**' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.capa({
    fecho: true,
    eyebrow: 'instalação concluída',
    titulo: ['Site no ar. Caixa aberto.', 'Entrega automática por plano.', '~Agora: feed + pitch + R$ 35/dia.'],
    subtitulo: 'Os roteiros de vídeo-pitch para Instagram, Facebook e LinkedIn estão no documento irmão deste manual. Verifica, Brasil.'
  });
  return d.gravar();
}

// ---------------------------------------------------------------- 3
async function doZeroAoAr(arquivo) {
  const d = new Deck({ arquivo, rodape: RODAPE });

  d.capa({
    eyebrow: 'o guia mestre · você liga, o desenvolvedor só confere',
    titulo: ['Do Zero ao Ar:', 'www.verimulta.com.br', '~funcionando e recebendo'],
    subtitulo: 'A arquitetura final com cada peça no lugar certo, as conexões na ordem exata (domínio » sistema » dinheiro » e-mail » OCR), o teste de fogo, e o Checklist de Homologação que o desenvolvedor assina dizendo "está tudo certo".'
  });

  d.folha({ eyebrow: 'a arquitetura final · quem faz o quê', titulo: 'Cada serviço no seu talento' });
  d.cartoes([
    { titulo: 'O provedor do domínio — a casa do nome', corpo: 'Registro do domínio `verimulta.com.br` e gestão da Zona DNS. Opcionalmente o e-mail profissional `contato@verimulta.com.br`. **Por que não o sistema todo aqui?** A hospedagem de sites comum não executa Node.js — e o nosso motor é Node.' },
    { titulo: 'Render — a casa do motor', corpo: 'O **sistema completo** (site + app + API + painel + webhook) roda no Render com deploy de 1 clique (`render.yaml`), **US$ 7/mês** no plano Starter. O domínio apenas **aponta** para ele: o cliente só vê `www.verimulta.com.br` e nunca sabe onde mora o motor.', destaque: true }
  ], 2, { y: d.y + 4 });
  d.tabela({
    colunas: ['Endereço', 'Aponta para', 'Onde se configura'],
    larguras: [1.1, 1.1, 1.6],
    tamanho: 9.2,
    linhas: [
      ['`www.verimulta.com.br`', 'Render (sistema completo)', 'Zona DNS » registro **CNAME** `www` » [destino do Render]'],
      ['`verimulta.com.br` (raiz)', 'Redirect para `www`', 'Painel do provedor » Redirecionamento de domínio'],
      ['`contato@verimulta.com.br`', 'Zoho Mail (ou o provedor)', 'Criar a caixa + **senha de aplicativo** para o SMTP']
    ],
    y: d.y + 6
  });

  d.folha({ eyebrow: 'conexão 1 · o código na nuvem (20 min)', titulo: 'GitHub + Render (o motor liga aqui)' });
  d.passos([
    { titulo: '1. GitHub', corpo: '`github.com` » conta com o e-mail da empresa » **New repository** `verimulta` (**Private**) » "uploading an existing file" » arraste o **conteúdo** da pasta `sistema` (o `servidor.js` na raiz) » Commit.' },
    { titulo: '2. Render', corpo: '`render.com` » Sign up with GitHub » **New + » Blueprint** » repositório `verimulta` » **Apply**. O `render.yaml` monta o serviço, o disco persistente e os segredos.' },
    { titulo: '3. O que o Blueprint já resolve', corpo: '`NODE_ENV=production` · `JWT_SECRET` e `ADMIN_SECRET` gerados · disco em `/var/data` com `DB_PATH` apontado · `ORIGENS_PERMITIDAS` preenchida. **Você preenche só o que depende de conta de terceiro:** `URL_BASE` = `https://www.verimulta.com.br` e, depois, as chaves do MP, do e-mail e do OCR.' },
    { titulo: '4. Prova de vida', corpo: '**Deploy Live** (bolinha verde) » abra `verimulta.onrender.com/app.html` no celular. Sistema na internet. Agora vamos dar o nome dele.' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'conexão 2 · o nome oficial (15 min + propagação)', titulo: 'www.verimulta.com.br apontando para o motor' });
  d.passos([
    { titulo: '1. No Render', corpo: 'Serviço » **Settings » Custom Domains** » Add `www.verimulta.com.br` » copie o destino CNAME que ele mostrar (algo como `verimulta.onrender.com`).' },
    { titulo: '2. Na Zona DNS do domínio', corpo: 'Painel » Domínios » `verimulta.com.br` » **Zona DNS / Editar DNS** » novo registro: Tipo **CNAME** · Nome `www` · Valor = o destino copiado » Salvar.' },
    { titulo: '3. Raiz redirecionando', corpo: 'Redirecionamento: `verimulta.com.br` » `https://www.verimulta.com.br` — assim quem digitar sem `www` também chega.' },
    { titulo: '4. Aguarde e confira', corpo: 'Propagação de 1 a 4 horas (até 24h no pior caso). Teste `www.verimulta.com.br` abrindo **com o cadeado** (SSL automático do Render). Ajuste `URL_BASE` no Render para o domínio final.' }
  ], { y: d.y + 6 });

  d.folha({ eyebrow: 'conexão 3 · o dinheiro (mercado pago · 30 min)', titulo: 'Cliente paga » acesso libera sozinho' });
  d.passos([
    { titulo: '1. Conta PJ', corpo: '`mercadopago.com.br` » criar conta com o CNPJ **55.745.297/0001-06** (PrimeCorp) » validar documentos » cadastrar a conta bancária de saque.' },
    { titulo: '2. Credencial', corpo: '`mercadopago.com.br/developers` » Suas integrações » Criar aplicação "Verimulta" » Credenciais de produção » copiar o **Access Token** (`APP_USR-...`) » Render: `GATEWAY`=`mercadopago` · `MP_ACCESS_TOKEN`= o token.' },
    { titulo: '3. Webhook (a liberação automática)', corpo: `Na aplicação » Webhooks » modo Produção » URL \`${WEBHOOK}\` » eventos de **Pagamentos + Assinaturas** » salvar » copiar a **assinatura secreta** » \`WEBHOOK_SECRET\` no Render.` },
    { titulo: 'O que acontece então', corpo: 'Pagou » o MP avisa » o servidor **valida o HMAC** e **reconsulta o status real** na API do MP » o plano libera » o e-mail sai » o MRR soma. **Zero toque humano.**' }
  ], { y: d.y + 2, tamanhoCorpo: 9.5 });

  d.folha({ eyebrow: 'conexões 4 e 5 · e-mail e ocr (35 min)', titulo: 'As últimas tomadas' });
  d.cartoes([
    { titulo: 'E-mail transacional', corpo: 'Crie `contato@verimulta.com.br` (Zoho Forever Free ou o plano de e-mail do provedor) » anote o servidor SMTP e a porta 465 » gere uma **senha de aplicativo** » no Render: `SMTP_HOST`, `SMTP_PORT`=`465`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.' },
    { titulo: 'OCR das fotos', corpo: '`console.cloud.google.com` » projeto "verimulta" » ativar **Cloud Vision API** » Credenciais » Chave de API » `GOOGLE_VISION_KEY` no Render. 1.000 leituras/mês grátis.' },
    { titulo: 'Teste do e-mail', corpo: 'Crie uma conta no app: o e-mail de boas-vindas deve chegar em 1 minuto. Chegou = tomada ligada. **Sem SMTP o sistema não quebra** — os e-mails ficam registrados na tabela `emails_log` e aparecem no Painel do Dono.' },
    { titulo: 'Borda e origens', corpo: '`ORIGENS_PERMITIDAS` lista os domínios autorizados a chamar a API de fora (a vitrine no Netlify, por exemplo). Vazio = só mesma origem. **Nunca** use `*`: isso abriria as rotas autenticadas para qualquer site.' }
  ], 2, { y: d.y + 4 });

  d.folha({ eyebrow: 'conexão 6 · o teste de fogo (15 min)', titulo: 'A primeira venda é sua' });
  d.passos([
    { titulo: '1.', corpo: 'No celular: `www.verimulta.com.br` » criar conta real » **aceitar os Termos** » e-mail de boas-vindas chegando.' },
    { titulo: '2.', corpo: 'Fotografar uma notificação real » OCR preenche » diagnóstico com o **Índice de Consistência** » paywall travando a probabilidade.' },
    { titulo: '3.', corpo: 'Assinar o **Combo 01 (R$ 29,90)** com o seu cartão » checkout MP » voltar ao app » badge **PLANO ATIVO** em até 1 min.' },
    { titulo: '4.', corpo: 'Gerar a Defesa » **PDF timbrado do servidor** » e o Extrato de Auditoria » abrir `/admin.html` com a sua chave » pagamento na trilha, **MRR R$ 29,90**.' },
    { titulo: '5.', corpo: 'Cancelar em 1 toque » cancelamento refletindo no MP. **Ciclo completo validado nos dois sentidos = liberado para vender.**' }
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
    eyebrow: 'a ordem de largada',
    titulo: ['O domínio aponta. O Render roda.', 'O Mercado Pago recebe. Você comanda.', '~O desenvolvedor? Só assina o "OK".'],
    subtitulo: '6 conexões, um teste de fogo, 20 itens de homologação — e o Verimulta está no ar, em nome da PrimeCorp. Verifica, Brasil.'
  });
  return d.gravar();
}

// ---------------------------------------------------------------- 4
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
    larguras: [1.25, 2.4],
    tamanho: 8.8,
    linhas: [
      ['`POST /v1/auth/register` · `/login`', 'Cadastro (**exige** `consentimento: true` e grava data, IP e versão do termo) e login » JWT. Rate limit por IP.'],
      ['`GET/POST /v1/veiculos`', 'Listar e adicionar placas (limites por plano).'],
      ['`POST /v1/multas/scan`', 'multipart foto » OCR » extração » grava a multa. Confere se o `veiculo_id` é do próprio usuário.'],
      ['`GET /v1/multas/:id/diagnostico`', 'Motor: 14 verificações + **Índice de Consistência** + probabilidade (com gating por plano).'],
      ['`POST /v1/recursos`', 'Gera a Defesa Prévia (402 sem assinatura — paywall no servidor).'],
      ['`GET /v1/recursos/:id/pdf`', '**Defesa Prévia em PDF timbrado**, gerada no servidor.'],
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
    { titulo: 'Environment', corpo: '`NODE_ENV` · `DB_PATH` · `JWT_SECRET` · `ADMIN_SECRET` · `WEBHOOK_SECRET` · `GATEWAY` · `MP_ACCESS_TOKEN` · `URL_BASE` · `SMTP_HOST/PORT/USER/PASS` · `EMAIL_FROM` · `GOOGLE_VISION_KEY` · `ORIGENS_PERMITIDAS` · `FONTES_MONITORAMENTO` · `VERSAO_TERMOS`.\n\n`DB_PATH` **tem de apontar para o disco persistente** (`/var/data`). `DEMO_NOVA_MULTA` jamais em produção.' },
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

// ---------------------------------------------------------------- 5
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

module.exports = { planoDeAtivacao, manualInstalacao, doZeroAoAr, handoffDesenvolvedor, cronogramaGoLive };
