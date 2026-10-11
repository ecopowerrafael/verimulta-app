# Verimulta — Pendências de homologação na VPS

Checklist cumulativo. Itens não marcados não foram considerados aprovados.

## Ambiente e backend

- [ ] Disponibilizar Node.js 22 ou 24.
- [ ] Disponibilizar compilador nativo compatível com `better-sqlite3`, ou binário validado da dependência.
- [ ] Instalar dependências do backend sem alterar as versões declaradas.
- [ ] Executar os testes existentes do backend no diretório `6_CODIGO_FONTE/sistema`.
- [ ] Executar o Express e o frontend React simultaneamente.
- [ ] Configurar `VITE_API_URL` somente no ambiente de homologação.

## Banco e dados

- [ ] Usar banco descartável e identificado para homologação.
- [ ] Confirmar schema/migrations e defaults antes dos testes.
- [ ] Confirmar que nenhum banco de produção é usado.
- [ ] Validar isolamento de usuário em veículos, multas, recursos e LGPD.
- [ ] Validar backup/rollback do banco de homologação.

## Autenticação e cadastro

- [ ] Cadastro válido com aceite LGPD.
- [ ] Rejeição de nome/e-mail/senha inválidos.
- [ ] Rejeição de duplicidade de e-mail/CPF.
- [ ] Login válido.
- [ ] Login inválido sem vazamento de informação.
- [ ] Persistência, restauração e logout da sessão.
- [ ] Sessão expirada e HTTP 401.

## Multas, OCR e auditoria

- [ ] Cadastro e listagem de veículos.
- [ ] Upload com tipo/tamanho válido.
- [ ] Rejeição HTTP 413 e tipos não aceitos.
- [ ] Leitura sem persistência antes da confirmação.
- [ ] OCR real com chave segura, se configurado.
- [ ] Caminho manual quando OCR estiver indisponível.
- [ ] Correção dos campos extraídos.
- [ ] Persistência somente após confirmação.
- [ ] Diagnóstico A1–A14 com dados reais do banco descartável.
- [ ] Paywall do plano gratuito.
- [ ] Isolamento entre usuários ao consultar diagnóstico.

## Defesa e PDFs

- [ ] Geração de defesa com plano elegível.
- [ ] Bloqueio de geração sem assinatura.
- [ ] Lista e acompanhamento de recursos.
- [ ] PDF de defesa gerado pelo backend.
- [ ] PDF de extrato de auditoria.
- [ ] Abertura/download/compartilhamento em navegador e dispositivo móvel.
- [ ] Desfecho deferido/indeferido e validação de valores inválidos.

## Planos, pagamentos e webhooks

- [ ] `/v1/planos` comparado com a grade exibida.
- [ ] Checkout demo validado sem ativação falsa.
- [ ] Checkout Mercado Pago validado somente com credenciais de homologação.
- [ ] Ativação confirmada apenas pelo backend/webhook.
- [ ] Cancelamento refletido no usuário.
- [ ] Webhook duplicado, atrasado, fora de ordem e inválido.
- [ ] Replay/HMAC e retorno HTTP do webhook.
- [ ] Frontend nunca libera plano por estado local.

## LGPD e segurança

- [ ] Exportação `/v1/eu/dados` sem vazamento de token.
- [ ] Exclusão exige assinatura cancelada.
- [ ] Exclusão/anonimização transacional.
- [ ] CORS restrito às origens de homologação.
- [ ] Rate limiting de login, upload e exclusão.
- [ ] XSS em textos de feedback e defesa.
- [ ] Segredos fora do repositório e dos logs.
- [ ] Armazenamento seguro de credencial no futuro Capacitor.

## Frontend e mobile

- [x] Typecheck React — execução local concluída sem erros.
- [x] Testes unitários/contratos — 21 testes passaram; integração HTTP continua pendente.
- [x] Build Vite — build local concluído sem erros.
- [ ] Jornadas reais em 320/360/390/430 px e desktop.
- [ ] Comparação visual lado a lado com o HTML legado.
- [ ] Estados de carregamento, erro, vazio e paywall.
- [ ] Acessibilidade básica por teclado/leitor de tela.
- [ ] Upload e download em Android/iOS reais.
- [ ] Botão voltar, suspensão/retomada e deep links.
- [ ] Só depois iniciar a etapa Capacitor nativa.

## Carga e operação

- [ ] Teste de carga da API em VPS isolada.
- [ ] Concorrência em cadastro, confirmação e webhook.
- [ ] Timeout/retry/backoff de integrações externas.
- [ ] Logs sem PII/segredos.
- [ ] Health check e observabilidade.
- [ ] Plano de rollback para o HTML legado.

**Última atualização:** 11/10/2026 — VM-04.06 concluiu a auditoria geral, corrigiu cache PWA, SEO duplicado, acessibilidade e catálogo Frota, além das correções de isolamento/refresh da VM-04.04; 52 testes locais passaram, typecheck e build passaram. Backend integrado, SEO em produção, segurança operacional e comparação visual permanecem pendentes na VPS. Nenhuma funcionalidade integrada foi declarada aprovada.

## VM-03 — repetir na VPS após as correções React

- [ ] Cadastro: confirmar que a sessão é gravada antes de `POST /v1/veiculos` e que o JWT chega ao backend.
- [ ] Cadastro: simular falha parcial da criação do veículo e confirmar que a conta permanece utilizável, sem duplicar placa em nova tentativa.
- [ ] Sessão: expirar um JWT e confirmar HTTP 401, limpeza do estado React e retorno ao login.
- [ ] Sessão: confirmar que uma resposta atrasada de token antigo não encerra uma sessão nova.
- [ ] Defesa: criar uma defesa com `multa_id` conhecido e abrir PDF existente usando `recurso_id` diferente.
- [ ] Defesa: confirmar que a tela de recursos não cria uma segunda defesa ao abrir recurso existente.
- [ ] Assinatura: validar o contrato atual de cancelamento e registrar se a mudança é imediata ou ao fim da vigência.
- [ ] Assinatura: confirmar que o frontend não libera nem bloqueia benefícios somente por estado local.
- [ ] Sessão restaurada: validar identidade e plano contra endpoint real quando o contrato existir; atualmente a proposta de `GET /v1/eu` continua pendente.

**Atualização VM-03:** correções locais implementadas e validadas com typecheck, 17 testes unitários/contratuais e build. Nenhum item acima foi aprovado para integração sem execução contra o backend real.

## VM-04.01 — repetir na VPS após a migração

- [ ] Selecionar cada veículo e confirmar `GET /v1/veiculos/:id/resumo` com isolamento do usuário autenticado.
- [ ] Confirmar estado vazio, carregamento e erro na tela de veículos.
- [ ] Confirmar pontos, limite, janela de 12 meses, validade e situação da CNH com dados reais.
- [ ] Salvar validade da CNH e confirmar formato, autorização e persistência no backend.
- [ ] Confirmar débitos somente com multas retornadas por `GET /v1/multas`, sem declarar débito oficial.
- [ ] Abrir os sete links oficiais e validar finalidade em navegador/dispositivo móvel.
- [ ] Confirmar que respostas antigas não alteram veículo, CNH ou diagnóstico após troca de sessão.

**Atualização VM-04.01:** quatro telas implementadas localmente; 21 testes passaram, mas todos os cenários acima permanecem pendentes de homologação integrada.

## VM-04.02 — repetir na VPS após a migração

- [ ] Confirmar que desconto SNE nunca é apresentado como garantido e que regras reais vêm do órgão competente.
- [ ] Trocar de usuário durante carregamento de veículo/CNH e confirmar que a resposta antiga não altera a nova sessão.
- [ ] Selecionar veículos diferentes e confirmar que o resumo e eventual associação da multa usam o identificador escolhido.
- [ ] Confirmar que dívida ativa permanece claramente indisponível sem convênio e não aceita dados pessoais localmente.
- [ ] Confirmar que o painel de frota e os cartões da rede são identificados como demonstrativos e não liberam cobrança/contato real.
- [ ] Confirmar que o credenciamento de parceiros não simula sucesso nem coleta dados sem endpoint.
- [ ] Validar navegação, foco, teclado e leitura das mensagens nos viewports 320/360/390/430 px e desktop.

**Atualização VM-04.02:** correções e quatro telas implementadas localmente; 23 testes passaram, mas os cenários acima permanecem pendentes de homologação integrada e comparação visual.

## VM-04.03 — repetir na VPS após a migração

- [ ] Enviar feedback somente com nota válida, comentário dentro de 4000 caracteres ou ambos.
- [ ] Confirmar `POST /v1/feedback` com nota e com comentário sem nota; não enviar `nota: null`.
- [ ] Confirmar que `GET /v1/feedback` retorna somente os feedbacks do usuário autenticado.
- [ ] Confirmar que duplo clique não gera envios duplicados enquanto a requisição está em andamento.
- [ ] Trocar de usuário durante carregamento/envio e confirmar que a resposta antiga não atualiza a sessão nova.
- [ ] Validar navegação inferior, indicação ativa, botões de voltar e histórico do navegador.
- [ ] Validar teclado, foco, leitor de tela e viewports 320/360/390/430 px e desktop.
- [ ] Comparar transparência com o HTML legado e confirmar que avisos legais não foram alterados.

**Atualização VM-04.03:** feedback, transparência e navegação implementados localmente; 34 testes passaram, mas os cenários acima permanecem pendentes de homologação integrada e visual.

## VM-04.03.1 — repetir na VPS após a correção

- [ ] Forçar erro HTTP/timeout/rede no envio e confirmar que nota e comentário permanecem preenchidos.
- [ ] Confirmar que o formulário só limpa após sucesso real de `POST /v1/feedback`.
- [ ] Fazer o POST retornar sucesso e interromper `GET /v1/feedback`; confirmar aviso separado e envio concluído.
- [ ] Acionar envio repetidamente durante uma requisição e confirmar ausência de duplicidade.
- [ ] Trocar de usuário ou expirar a sessão durante feedback e confirmar que a resposta antiga não atualiza a nova sessão.
- [ ] Fazer logout e usar Voltar; confirmar que telas protegidas não são restauradas.
- [ ] Recarregar em uma tela dependente de diagnóstico/defesa e confirmar fallback seguro sem dados de outro usuário.
- [ ] Navegar repetidamente para a mesma tela e confirmar que o histórico não cresce com entradas duplicadas.

**Atualização VM-04.03.1:** correções implementadas localmente; 34 testes passaram, mas os cenários acima permanecem pendentes de homologação real.

## VM-04.04 — repetir na VPS após a migração do painel administrativo

- [ ] Abrir a entrada React `admin.html` com `ADMIN_SECRET` fornecido pelo mecanismo operacional seguro; confirmar que a chave não aparece em URL, storage, logs ou código compilado.
- [ ] Confirmar 401 e 403 com chave ausente/incorreta, sem reaproveitar o JWT da aplicação do usuário e sem revelar o segredo na mensagem.
- [ ] Comparar indicadores, usuários, pagamentos, multas, emails, feedbacks e varreduras com os campos reais de `GET /v1/admin/resumo` e `GET /v1/admin/feedbacks`.
- [ ] Confirmar acesso restrito, exposição de PII somente para administradores autorizados e ausência de cache indevido nas respostas administrativas.
- [ ] Executar alertas de prazo e varredura somente após confirmação explícita; confirmar que duplo clique não cria chamadas simultâneas e que sucesso só aparece após resposta da API.
- [ ] Confirmar que abrir ou recarregar o painel não dispara tarefas operacionais automaticamente.
- [ ] Sair do painel e confirmar limpeza da credencial em memória; expirar/revogar a chave e confirmar retorno seguro ao acesso.
- [ ] Validar tabelas vazias, erro de rede, carregamento, foco, teclado, leitura e viewports 320/360/390/430 px e desktop.
- [ ] Comparar visualmente a entrada React com `6_CODIGO_FONTE/sistema/publico/admin.html`, sem declarar equivalência sem evidência.
- [ ] Avaliar substituição futura da chave compartilhada por identidade individual, RBAC, auditoria e proteção contra replay antes de uso produtivo.
- [ ] Definir idempotency key/controle transacional no backend para retries de tarefas administrativas; o bloqueio atual é apenas no frontend.

**Atualização VM-04.04:** painel administrativo React implementado localmente; typecheck passou, 52 testes passaram no conjunto atual e build multi-page gerou `index.html`, `app.html` e `admin.html`. Todos os cenários acima permanecem pendentes de homologação na VPS.

## VM-04.05 — repetir na VPS após a migração da landing

- [ ] Confirmar que `/index.html` entrega o título, description, canonical, Open Graph, H1/H2/H3, links internos e conteúdo textual sem depender da execução de JavaScript.
- [ ] Confirmar que `/app.html` continua abrindo a aplicação autenticada e que `/admin.html` continua isolado do JWT do usuário.
- [ ] Comparar landing React com `6_CODIGO_FONTE/sistema/publico/index.html` em desktop e nos viewports móveis; validar fontes, ícones, gradientes, sombras, espaçamentos, animações e responsividade.
- [ ] Validar links para `app.html`, `termos.html`, `privacidade.html` e `instalar.html`, além de manifest, service worker, ícones e `robots.txt`.
- [ ] Enviar placas válidas e inválidas para `GET /v1/consulta-placa/:placa`; confirmar rate limit, erro de rede e que `consulta_oficial: false` não apresenta multa, IPVA, licenciamento ou recall como fato.
- [ ] Confirmar que a lista de espera não afirma cadastro recebido enquanto não houver endpoint de recebimento configurado; nenhum dado deve ser enviado sem destino comprovado.
- [ ] Verificar canonical/OG no domínio real, indexação e ausência de sitemap inexistente anunciado como disponível.
- [ ] Confirmar compatibilidade da saída multi-page com o deploy atual do Netlify sem publicar ou substituir o site nesta etapa.

**Atualização VM-04.05:** landing pública, entrada autenticada compatível, documentos legais e ativos foram preparados localmente; 52 testes passaram, typecheck e build multi-page passaram. SEO em produção, comparação visual e integração real permanecem pendentes na VPS.

## VM-04.06 — repetir na VPS após a auditoria geral

- [ ] Comparar todas as telas do app, landing e admin com o HTML original em 320/360/390/430/768/1366 px, registrando evidência visual e divergências.
- [ ] Confirmar cadastro, consentimento, login, troca/expiração de sessão, veículo, OCR, confirmação, diagnóstico, defesa/PDF, CNH, débitos, consultas, dívida ativa, frota, rede, parceiro, planos, checkout, perfil, LGPD, feedback, transparência, logout e histórico.
- [ ] Confirmar que o service worker instalado abre `/app.html`, não cacheia `/v1`, checkout, admin ou respostas autenticadas e atualiza do cache anterior para `verimulta-public-v3`.
- [ ] Validar a landing com uma ferramenta de inspeção de metadados/crawler: uma única description, canonical, Open Graph, headings, links internos, robots e ausência de sitemap anunciado sem arquivo.
- [ ] Repetir consulta pública com placa válida, inválida, excesso de chamadas, indisponibilidade e resposta `consulta_oficial: false`; confirmar ausência de dados oficiais inventados.
- [ ] Confirmar que a lista de espera não envia nem afirma receber dados até existir endpoint operacional.
- [ ] Confirmar tarefa administrativa executada com refresh falho, logout durante resposta, troca de chave, 401/403, duplo clique e resultado operacional já confirmado; não repetir tarefa por erro de refresh.
- [ ] Validar foco, labels, teclado, contraste, `prefers-reduced-motion`, controles desabilitados e mensagens acessíveis.
- [ ] Registrar como bloqueantes para produção a falta de autenticação administrativa individual/RBAC/auditoria, integrações oficiais, endpoint de lista de espera, checkout/webhook real e comparação visual não executada.

**Atualização VM-04.06:** auditoria e correções locais concluídas; 52 testes passaram, typecheck e build multi-page passaram. A Etapa 04 não está homologada nem pronta para produção sem os cenários acima.

## VM-05.01 — preparação de infraestrutura e homologação

- [ ] Provisionar staging Linux com Node 22.x, processo sem root, proxy HTTPS e `/v1/saude` monitorado.
- [ ] Definir domínio, sizing, RPO/RTO, retenção de logs, backup criptografado e restauração comprovada.
- [ ] Separar staging/produção por banco, secrets, webhook, SMTP e gateway; manter `GATEWAY=demo` somente em staging.
- [ ] Validar instalação Linux do módulo nativo `better-sqlite3` sem copiar artefatos incompatíveis.
- [ ] Validar CORS, proxy confiável, rate limits, upload temporário, limpeza, SMTP/OCR e timeout das integrações.
- [ ] Homologar autenticação, isolamento por usuário/veículo, webhooks idempotentes e jobs de prazo/varredura.
- [ ] Executar o checklist de `CHECKLIST-HOMOLOGACAO-VPS.md` e anexar evidências.
- [ ] Não iniciar SQLite → PostgreSQL antes de inventário, backup restaurável, schema versionado e rollback ensaiado.

**Atualização VM-05.01:** diagnóstico, plano VPS, plano SQLite/PostgreSQL, checklist e `.env.example` foram preparados localmente; nenhum deploy, acesso à VPS ou migração de banco foi executado. O Service Worker foi corrigido para não devolver `app.html` a recursos não navegacionais; a validação em navegador real permanece pendente.

## VM-05.02 — preparação de staging Linux isolado

- [ ] Identificar e autorizar explicitamente uma VPS dedicada ao VeriMulta; nenhum host ou domínio de outro projeto pode ser reutilizado por suposição.
- [ ] Provisionar Ubuntu, Node 22.x, usuário limitado, diretórios isolados, Nginx, TLS e systemd.
- [ ] Copiar somente o artefato aprovado e gerar `frontend-react/dist`; confirmar que Nginx entrega React em `/`, `/app.html` e `/admin.html`, sem servir o HTML legado no lugar.
- [ ] Criar banco SQLite novo de staging, habilitar/verificar WAL e foreign keys conforme o comportamento real, sem copiar PII.
- [ ] Criar `.env` com segredos exclusivos, `GATEWAY=demo`, SMTP/Google Vision/fontes oficiais desativados e `DEMO_NOVA_MULTA=false`.
- [ ] Validar health check, reinício, permissões, journald, limite de upload e proxy sem cache de respostas privadas.
- [ ] Executar backup WAL e restauração em cópia descartável; registrar integridade e permissões.
- [ ] Confirmar que jobs internos rodam em uma única instância e não enviam e-mails, consultam fontes não autorizadas ou atingem produção.

**Atualização VM-05.02:** modelos systemd/Nginx, scripts de verificação/instalação/backup/restauração e instruções de operação foram preparados em `infra/vps/`. Nenhuma VPS foi acessada ou provisionada; todos os testes Linux e operacionais permanecem pendentes.
