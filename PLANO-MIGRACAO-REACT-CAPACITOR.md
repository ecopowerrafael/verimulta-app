# Verimulta — Plano de migração para React + TypeScript + Capacitor

**Etapa:** preparação, sem implementação da migração
**Data da auditoria:** 11/10/2026
**Escopo analisado:** `6_CODIGO_FONTE/sistema/publico/`, `6_CODIGO_FONTE/site-netlify/` e os contratos expostos por `sistema/servidor.js`
**Estado atual:** frontend legado operacional em HTML/CSS/JavaScript inline; backend Node.js/Express preservado

## 1. Diagnóstico executivo

O Verimulta é uma aplicação web/PWA de auditoria de multas, com autenticação, cadastro de veículos, leitura de documentos, auditoria A1–A14, jurimetria, geração de defesa prévia, acompanhamento de recursos, planos pagos, LGPD e painel administrativo.

O frontend atual não usa framework. Ele é composto por páginas HTML com `<style>` e `<script>` inline:

- `publico/index.html`: landing page e captação de lista de espera.
- `publico/app.html`: aplicação autenticada do usuário, organizada como uma SPA manual com seções `.tela` e a função global `go(id)`.
- `publico/admin.html`: painel administrativo independente.
- `manifest.json` e `sw.js`: instalação e cache básico de PWA.
- `instalar.html`, `termos.html` e `privacidade.html`: instalação/instruções e páginas legais.
- `site-netlify/`: cópia derivada do site público, sincronizada por `sincronizar-netlify.js`.

**Confirmado:** não há arquivos `.css`, `.ts`, `.tsx`, configuração Vite ou componentes frontend separados. O CSS e a lógica estão dentro dos HTMLs.

**Implicação:** a primeira migração deve estabelecer contratos e uma fundação React mínima sem tentar converter o sistema inteiro de uma vez. O frontend legado precisa continuar sendo servido pelo backend durante todo o período de equivalência.

## 2. Inventário completo do frontend

### 2.1 Landing page — `publico/index.html`

Seções e fluxos observados:

- Cabeçalho com logotipo, menu de seções e CTA para lista de espera.
- Hero com proposta de valor e demonstração visual de uma auditoria.
- Consulta pública de placa (`GET /v1/consulta-placa/:placa`).
- Seção “Como funciona”, com três etapas.
- Apresentação das 14 verificações, agrupadas em famílias.
- Ciclo de proteção e explicação do produto.
- Planos com alternância mensal/anual.
- Rede/serviços e chamada para parceiros.
- FAQ e blocos de confiança/privacidade.
- Formulário de lista de espera, com modo demonstração local e endpoint externo opcional configurável em `TORQON_CONFIG.formEndpoint`.
- Rodapé legal, termos e política de privacidade.
- Registro do service worker.

Comportamento visual: página editorial responsiva, com identidade azul-marinho/azul de placa/amarelo de sinalização, cards, CTAs, tipografia Sora/Inter/IBM Plex Mono e ilustração de documento de multa.

### 2.2 Aplicação autenticada — `publico/app.html`

O fluxo manual atual contém as seguintes telas (`id` preservado como referência de migração):

| Tela | Responsabilidade | Entradas/saídas principais |
|---|---|---|
| `t-login` | Login | E-mail/CPF e senha; JWT |
| `t-cadastro` | Cadastro | Nome, CPF, e-mail, senha, placa, foto opcional, consentimento LGPD |
| `t-home` | Resumo | Quantidade de multas, prazo, placa, pontos, card da multa mais recente |
| `t-scan` | Início da verificação | Upload/fotografia da notificação ou digitação manual |
| `t-analise` | Estado intermediário | Animação de processamento do documento |
| `t-confirmar` | Conferência | Campos extraídos/editáveis antes de persistir a multa |
| `t-diag` | Diagnóstico | Auditoria A1–A14, vícios, probabilidade/paywall, extrato |
| `t-defesa` | Defesa prévia | Revisão, geração de PDF e acompanhamento/protocolo |
| `t-status` | Recursos | Timeline/estado dos recursos e ação para verificar nova multa |
| `t-veiculo` | Veículo | Resumo do veículo, multas e atalhos |
| `t-cnh` | CNH | Pontos calculados e validade da CNH |
| `t-debitos` | Débitos | Lista de multas cadastradas localmente |
| `t-divida` | Dívida ativa | Placa, Renavam e CPF; atualmente consulta/fluxo demonstrativo |
| `t-frota` | Painel de frota | Área de frota com bloqueio de plano |
| `t-rede` | Rede credenciada | Prestadores e ações demonstrativas |
| `t-parceiro` | Credenciamento | Categoria, periodicidade/preço e ação demonstrativa |
| `t-planos` | Planos | Combos, planos empresariais e Frota; checkout |
| `t-consultas` | Consultas oficiais | Links externos para Senatran, Detran, IPVA e Receita |
| `t-perfil` | Perfil | Conta, plano, LGPD, termos, privacidade, cancelamento e logout |
| `t-feedback` | Feedback | Nota, texto e histórico de feedback |
| `t-transparencia` | Transparência | Escopo, limitações e tratamento de dados |

Observação: a tabela inclui 20 identificadores de tela/fluxo, incluindo login, cadastro e estados intermediários; a migração deve preservar todos, mesmo que algumas áreas hoje sejam demonstrativas.

Elementos globais do app:

- Navegação inferior: Início, Recursos, Verificar, Rede e Perfil.
- Paywall em folha inferior: overlay `veu`, folha `paywall` e motivos `placa3`, `probabilidade`, `defesa`, `alertas` e `frota`.
- Toast global `toast`.
- Cabeçalhos com voltar, cards, pills de status, timeline, listas e botões primários/secundários.
- Registro de service worker ao final da página.

### 2.3 Painel administrativo — `publico/admin.html`

- Entrada de chave administrativa (`x-admin-secret`).
- KPIs: usuários, assinantes, MRR, multas auditadas e defesas geradas.
- Tabelas de usuários, pagamentos, multas, feedbacks, e-mails e varreduras.
- Ação para rodar alertas de prazo.
- Ação para rodar varredura de placas.
- Tratamento visual de erro de autenticação e estados vazios.

O painel é uma tela administrativa separada, sem JWT de usuário. Deve ser migrado separadamente e não ser misturado ao shell da aplicação do cliente.

### 2.4 Páginas auxiliares e artefatos visuais

- `instalar.html`: instruções de instalação da PWA.
- `termos.html`: termos de uso.
- `privacidade.html`: política de privacidade/LGPD.
- `manifest.json`: nome Verimulta, modo standalone, orientação portrait, `pt-BR`, ícones 192/512 e cores `#0B3C7E`.
- `sw.js`: cache `verimulta-v1`, precache mínimo e fallback para `app.html` em falha de GET.
- `icones/favicon.png`, `icone-192.png`, `icone-512.png` e `social.png`: ativos de marca.
- `robots.txt`: controle básico de rastreamento.

## 3. Componentes visuais e tokens a preservar

Não existem componentes técnicos reutilizáveis hoje; existem padrões visuais reutilizados por classes e markup. Na migração, esses padrões devem virar componentes React somente quando houver mais de um consumidor ou quando o fluxo exigir estado próprio.

### Componentes candidatos

- `BrandLogo` / `LogoMark`.
- `PageHeader` com voltar, título e subtítulo.
- `BottomNavigation`.
- `Card` (`cartao`) e `ListRow` (`linha-item`).
- `Button` nos variantes primário, secundário, amarelo, mini e fantasma.
- `StatusPill` (`ok`, `alerta`, `neutro`, `pro`).
- `Toast`.
- `PaywallSheet` e `ModalOverlay`.
- `Timeline` de recurso.
- `StatCard`/`KpiCard`.
- `DataTable` administrativa.
- `EmptyState` e `ErrorState`.
- `DocumentScanFrame`/estado de análise.
- `AuditCheckLine` e `ProbabilityBar`.
- `PlanCard`.
- `FormField`/`ConsentCheckbox`.

### Tokens obrigatórios

Os valores devem ser extraídos para tokens CSS/TypeScript sem alteração visual inicial:

- `--noite: #071E42`
- `--placa: #0B3C7E` e `--placa2: #0E4C9E`
- `--sinal: #FFC933` e `--sinal2: #FFB300`
- `--ok: #0E8A5F` e `--ok2: #39B489`
- `--vicio: #D6453A` (app) / `#C22F2F` (landing/admin; diferença deve ser documentada)
- `--ink`, `--papel`, `--branco`, `--cinza`, `--linha`
- raios `20px`/`14px`, sombras `--sombra`/`--sombra2`
- tipografias Sora, Inter e IBM Plex Mono
- largura visual máxima de 430px no app e uso de `env(safe-area-inset-bottom)`

Não substituir emojis, SVG inline, logotipo, espaçamentos, gradientes, tipografia ou estados de cor durante a primeira migração.

## 4. Estado, eventos e dependências atuais

### Estado central atual

`app.html` mantém o objeto global `APP`, com:

```text
token, nome, email, cpf, placa, fotoURL, assinante, plano,
multas, veiculos, diag, recursoId, veiculoId, telaAtual
```

Também usa:

- `FB_NOTA` para a nota de feedback.
- Campos de formulário por `document.getElementById`.
- `localStorage.vm_sessao` para token e resumo da sessão.
- Classes CSS (`ativa`, `mostra`, `on`, `borrado`) como máquina de estado visual.

Na primeira versão React, substituir `APP` por um estado de sessão tipado e estado de tela/fluxo separado. Não duplicar em estado valores que possam ser derivados da resposta do servidor.

### Eventos e navegação

- Muitos eventos são `onclick` inline; a migração deve convertê-los gradualmente para handlers React.
- `go(id)` alterna telas, classe ativa, barra inferior e `APP.telaAtual`.
- Formulários validam localmente antes da chamada, mas o backend continua sendo a autoridade.
- `FileReader` converte foto de perfil em data URL local; não há endpoint de persistência dessa foto identificado.
- O botão de biometria é apenas demonstrativo e não deve ser apresentado como funcionalidade nativa antes de existir contrato seguro.

### Integrações de browser

- `localStorage`: sessão JWT.
- `FormData` e `<input type="file">`: leitura de documento.
- `FileReader`: foto de perfil local.
- `Blob`, `URL.createObjectURL` e atributo `download`: JSON LGPD e PDFs.
- `window.open`: links oficiais, termos, privacidade, checkout e fallback de impressão.
- `fetch`: API própria e formulário externo opcional.
- Service worker: PWA/offline básico.
- Fontes externas Google Fonts.

## 5. Inventário de chamadas de API do frontend

Contratos devem ser tipados a partir de `servidor.js` e dos testes de API, não inferidos apenas pelo markup.

| Método | Endpoint | Uso no frontend | Autenticação/observação |
|---|---|---|---|
| POST | `/v1/auth/register` | Cadastro | Público; retorna JWT e usuário |
| POST | `/v1/auth/login` | Login | Público; retorna JWT e usuário |
| GET/POST | `/v1/veiculos` | Listagem e cadastro inicial | JWT |
| POST | `/v1/multas/ler` | OCR/leitura sem persistir | JWT + multipart `foto` |
| POST | `/v1/multas/scan` | Confirmação e criação da multa | JWT; atualmente JSON no fluxo confirmado |
| GET | `/v1/multas` | Lista de multas | JWT |
| GET | `/v1/multas/:id/diagnostico` | Auditoria e jurimetria | JWT; paywall pode ocultar probabilidade |
| POST | `/v1/recursos` | Geração de defesa | JWT + assinatura |
| GET | `/v1/recursos` | Lista de recursos/status | JWT |
| GET | `/v1/recursos/:id/pdf` | Download da defesa | JWT + assinatura; resposta binária |
| GET | `/v1/multas/:id/extrato.pdf` | Download do extrato | JWT + assinatura; resposta binária |
| POST | `/v1/checkout` | Checkout do plano | JWT; abre `checkout_url` |
| POST | `/v1/assinaturas/ativar` | Ativação em modo demo | JWT; não usar como autoridade em produção |
| POST | `/v1/assinaturas/cancelar` | Cancelamento | JWT |
| GET/POST | `/v1/cnh` | Pontos/validade | JWT |
| GET | `/v1/veiculos/:id/resumo` | Resumo do veículo | JWT |
| POST/GET | `/v1/feedback` | Envio/histórico | JWT |
| GET | `/v1/eu/dados` | Exportação LGPD | JWT; binário JSON |
| DELETE | `/v1/eu/conta` | Exclusão/anonimização | JWT; operação destrutiva, exigir confirmação |
| GET | `/v1/consulta-placa/:placa` | Consulta pública da landing | Público e rate-limited |
| GET/POST | `/v1/admin/resumo`, `/v1/admin/feedbacks` | Painel administrativo | `x-admin-secret`; segredo nunca persistido em storage do app |
| POST | `/v1/admin/tarefas/prazos` | Alertas manuais | `x-admin-secret` |
| POST | `/v1/admin/tarefas/varredura` | Varredura manual | `x-admin-secret` |

Endpoints existentes no backend, mas não consumidos pelos HTMLs auditados, devem permanecer fora do escopo da primeira tela migrada até haver requisito explícito: `/v1/jurimetria/avaliar`, `/v1/planos`, `/v1/desfecho`, `/v1/fontes`, `/v1/fipe/*`, `/v1/veiculos/:id/consulta-externa`, `/v1/qr.svg`, `/v1/endereco` e webhooks.

### Incompatibilidades e cuidados de contrato

- `API` é lida de `window.VERIMULTA_API_URL`; em Capacitor deverá existir configuração por ambiente, sem hardcode de produção.
- O app atual faz `r.json()` por padrão; respostas PDF/JSON LGPD são binárias e devem ter cliente HTTP separado.
- Erros HTTP são retornados como `{ ok, status, dados }`, sem exceção automática; a camada React deve padronizar erros sem esconder status 401/402/403/409/429/500.
- O login aceita campo rotulado “E-mail ou CPF”, mas o backend observado consulta `email`; a migração deve preservar o comportamento real e não prometer login por CPF sem ajuste de backend autorizado.
- O checkout retorna URL externa; dentro do app nativo será necessário fluxo de navegador externo/deep link e confirmação posterior por API/webhook.
- A ativação direta existe para demo e é bloqueada em produção; não deve ser usada para liberar recursos no cliente por decisão local.

## 6. Estrutura React + TypeScript recomendada

Adicionar uma aplicação nova em diretório próprio, sem mover o frontend legado no primeiro momento:

```text
frontend-react/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    app/
      App.tsx
      routes.tsx
      env.ts
      providers/
    pages/
      landing/
      auth/
      home/
      multa/
      recurso/
      veiculo/
      cnh/
      planos/
      rede/
      perfil/
      feedback/
      admin/
    components/
      layout/
      form/
      feedback/
      audit/
      billing/
      data-display/
    features/
      session/
      multas/
      recursos/
      veiculos/
      cnh/
      assinatura/
      lgpd/
      admin/
    services/
      apiClient.ts
      authApi.ts
      multasApi.ts
      recursosApi.ts
      billingApi.ts
      adminApi.ts
      lgpdApi.ts
    hooks/
    state/
    types/
    styles/
      tokens.css
      legacy-visual.css
      globals.css
    integrations/
      capacitor/
    test/
```

Princípios:

- Um `apiClient` com base URL, autenticação, timeout e tratamento de erro; serviços por domínio, sem duplicar regras de negócio.
- Tipos de request/response separados dos tipos de view model quando a forma visual divergir.
- Contexto de sessão pequeno; estado de servidor não deve ser duplicado sem necessidade.
- React Router somente para rotas necessárias, preservando deep links e URLs existentes.
- Nenhum store global complexo na primeira etapa; usar estado local e contexto de sessão até surgir evidência de necessidade.
- `strict: true`, sem `any` e sem casts como correção de contrato.
- O backend continua responsável por autorização, tenant/ownership, plano, limites, LGPD e pagamento.

## 7. Estratégia de preservação visual

1. Congelar screenshots de referência da landing, login, home, scan, confirmação, diagnóstico, paywall, planos, perfil e painel administrativo em viewport móvel e desktop.
2. Extrair tokens exatamente dos estilos atuais, mantendo variações por superfície quando os valores diferem.
3. Reproduzir primeiro markup e CSS, antes de refatorar comportamento ou redesenhar componentes.
4. Manter fontes, pesos, gradientes, raios, sombras, emojis/SVG, largura de 430px, safe areas e animações.
5. Comparar screenshots por pixel/diff com tolerância documentada para fontes externas e renderização nativa.
6. Testar viewport 320, 360, 390, 430 e desktop; testar teclado virtual, notch, modo portrait e landscape controlado.
7. Só remover o HTML legado após equivalência funcional, visual e operacional homologada.

O visual atual é a especificação. A migração pode corrigir acessibilidade e adaptação nativa, mas não deve alterar identidade ou hierarquia visual por preferência.

## 8. Estratégia incremental de migração

### Fase 0 — Baseline e contratos

- Registrar screenshots e fluxos manuais do frontend atual.
- Documentar respostas reais dos endpoints usados.
- Fixar matriz de ambientes e origem da API.
- Confirmar Node/npm e processo de build sem instalar nada nesta etapa.

### Fase 1 — Fundação sem alterar produção

- Criar `frontend-react/` isolado.
- Configurar TypeScript estrito, Vite, lint/testes escolhidos após verificar necessidade e compatibilidade.
- Implementar tokens, layout mobile e cliente HTTP tipado.
- Implementar sessão e navegação, sem remover o legado.

### Fase 2 — Primeira fatia representativa

Migrar o fluxo **login → home → verificar multa → confirmação → diagnóstico**. Essa fatia exercita autenticação, upload, multipart, formulários, navegação, paywall, estados de erro e dados reais, sem começar pela parte mais irreversível de pagamentos ou administração.

### Fase 3 — Operações de valor

Migrar defesa/recursos, PDFs, planos/checkout, cancelamento e telas LGPD. Validar que pagamentos continuam dependendo do backend e do webhook.

### Fase 4 — Conta e módulos auxiliares

Migrar veículo, CNH, débitos, consultas, rede, parceiro, feedback e transparência. Áreas demonstrativas devem continuar explicitamente marcadas como demonstrativas.

### Fase 5 — Admin e landing

Migrar `admin.html` como superfície isolada; depois migrar `index.html` e o formulário de lista de espera. Manter termos, privacidade e instalação como páginas/rotas compatíveis.

### Fase 6 — Capacitor

- Adicionar Capacitor somente após a versão web estar equivalente.
- Gerar Android/iOS, configurar identificador, ícones, splash e safe areas.
- Substituir apenas integrações que realmente precisem de plugin nativo.
- Homologar checkout, PDFs, uploads, deep links, retomada após suspensão e sessão expirada.

### Fase 7 — Substituição controlada

- Publicar o React sob rota/domínio de homologação.
- Comparar métricas e erros com o legado.
- Liberar por grupo/feature flag se possível.
- Tornar React padrão somente após critérios de aceite completos.
- Manter rollback para o HTML legado até o período de estabilidade definido.

## 9. Adaptações necessárias para Capacitor

### Segurança e sessão

`localStorage` é aceitável como baseline web, mas não deve ser assumido como armazenamento seguro nativo. Para Android/iOS, avaliar armazenamento seguro do sistema via plugin oficial compatível, com expiração, logout e invalidação de sessão explícitos. Nunca armazenar `ADMIN_SECRET` no aplicativo cliente.

### CORS e API

Capacitor usa uma origem diferente da web. A allowlist `ORIGENS_PERMITIDAS` e a política de CORS precisam contemplar a origem efetivamente usada pelo build, sem abrir `*` para rotas autenticadas. Essa alteração pertence a uma etapa posterior do backend/deploy e não será feita agora.

### Deep links e checkout

`window.open` não é contrato suficiente para checkout nativo. Definir retorno por deep link/app link, estado de tentativa e consulta posterior de assinatura. A confirmação deve vir da API/webhook, nunca do retorno visual do navegador.

### Upload e câmera

O `<input type="file" accept="image/*">` funciona na web, mas a experiência nativa deverá mapear câmera/galeria para `File` ou multipart equivalente. Preservar limite de 8 MB e tipos aceitos do backend; não confiar no MIME declarado pelo cliente.

### PDFs, downloads e compartilhamento

`URL.createObjectURL` + `a.download` pode não oferecer a mesma experiência no WebView. Criar adaptador por plataforma para receber bytes, gravar em cache privado, abrir/compartilhar e remover temporários. A autorização continua no endpoint JWT.

### Navegação e ciclo de vida

Tratar botão voltar Android, deep link para rota interna, suspensão/retomada e expiração do JWT. A navegação não deve depender de IDs DOM ou de `window.open` para estados essenciais.

### PWA e fontes

O service worker atual é cache-first/rede com fallback simples e pode servir HTML desatualizado. No Capacitor, o ciclo de atualização é diferente; não duplicar a estratégia de cache sem decidir a autoridade de versão. Fontes Google Fonts exigem comportamento definido offline e fallback visual equivalente.

## 10. Riscos e mitigação

| Risco | Classificação | Mitigação |
|---|---|---|
| Divergência visual por reescrita do CSS | Alto | Baseline de screenshots, tokens congelados e diff visual |
| Perda de fluxo escondido em `onclick`/DOM | Alto | Inventário por tela, testes de jornada e migração vertical |
| Contrato de API inferido incorretamente | Alto | Tipar a partir do backend/testes e capturar fixtures reais |
| JWT exposto em storage nativo | Alto | Secure storage, expiração e logout; nunca guardar segredo admin |
| Checkout sem confirmação confiável | Alto | Deep link apenas como retorno; status real via API/webhook |
| Upload/PDF incompatíveis no WebView | Alto | Adaptadores de plataforma e teste em dispositivo físico |
| CORS bloqueando Capacitor | Alto | Homologar origem real e allowlist restrita |
| Service worker/cache servindo versão antiga | Médio | Versionamento explícito, limpeza controlada e rollback |
| Cópias `publico/` e `site-netlify/` divergirem | Médio | Continuar usando o sincronizador e definir fonte oficial |
| Monólito inicial virar abstração excessiva | Médio | Migrar uma fatia, poucos providers e serviços por domínio |
| Regra crítica duplicada no frontend | Alto | UI apenas reflete backend; paywall/permissão sempre revalidados |
| HTML legado e React terem estados incompatíveis | Médio | Feature flag/rota separada, contrato de sessão e plano de rollback |
| Dados em SQLite limitarem escala | Alto, fora desta etapa | Não alterar banco agora; registrar para plano de evolução separado |

## 11. Critérios de aceite e testes

### Baseline visual

- Screenshots aprovados para cada tela migrada nos viewports definidos.
- Diferenças explicadas; nenhuma troca silenciosa de cor, fonte, espaçamento, ícone ou texto legal.
- Responsividade e safe area verificadas em Android/iOS/web.

### Autenticação e sessão

- Cadastro exige consentimento e senha mínima.
- Login válido abre home; credencial inválida mostra erro sem vazar detalhe.
- 401 limpa/renova sessão conforme política definida.
- Logout remove credencial local.
- Sessão expirada não deixa a UI aparentar que uma operação protegida foi concluída.

### Multa e auditoria

- Upload aceito/rejeitado conforme contrato.
- Leitura do documento não grava antes da confirmação.
- Campos OCR podem ser corrigidos.
- Auditoria exibe todos os checks retornados.
- Probabilidade e defesa respeitam paywall do backend.
- Erros de rede, timeout, 413, 429 e 500 têm estado explícito.

### Defesa, PDF e cobrança

- Geração de defesa exige assinatura real no backend.
- PDFs são baixados/abertos/compartilhados em web e dispositivo.
- Checkout abre retorno compatível e não ativa plano por decisão local.
- Cancelamento reflete o estado retornado pela API.

### LGPD e administração

- Exportação salva/compartilha o arquivo sem expor token.
- Exclusão exige confirmação clara e encerra sessão após sucesso.
- Admin não persiste `x-admin-secret` em localStorage, URL ou logs.
- Feedback é escapado e não permite XSS.

### Testes técnicos recomendados

- Testes unitários de adaptadores, validações e mapeadores.
- Testes de contrato para cada endpoint consumido.
- Testes de integração da jornada login → scan → confirmação → diagnóstico.
- Testes de regressão visual.
- Testes de acessibilidade com teclado/leitor de tela.
- Testes em Android e iOS reais para upload, checkout, PDF, voltar e suspensão.
- Testes de segurança para token, CORS, paywall, admin, XSS e arquivos.

## 12. Primeira implementação recomendada

Ainda não implementar nesta etapa. Quando houver autorização, a primeira fatia deve ser:

1. Criar `frontend-react/` isolado, sem remover nem modificar o legado.
2. Reproduzir tokens e shell visual do `app.html`.
3. Implementar `t-login`, `t-cadastro` e `t-home`.
4. Criar `apiClient` tipado para register/login, veículos, multas, CNH e sessão.
5. Migrar `t-scan`, `t-analise`, `t-confirmar` e `t-diag` como uma jornada única.
6. Cobrir essa jornada com testes de contrato, integração e screenshots.
7. Executar lado a lado com o legado em uma rota de homologação.

Essa escolha é representativa porque exercita autenticação, estado, upload, formulário, API, navegação e paywall, mas não altera pagamento, banco ou backend. O critério para avançar é equivalência comprovada, não apenas renderização sem erros.

## 13. Decisões fora do escopo desta etapa

- Não implementar React, TypeScript ou Capacitor agora.
- Não modificar `servidor.js`, banco, endpoints ou contratos.
- Não instalar dependências.
- Não alterar arquivos existentes do frontend.
- Não fazer deploy, commit ou push.
- Não declarar a migração iniciada antes de autorização explícita.

## Fontes da auditoria

- `6_CODIGO_FONTE/sistema/publico/index.html`
- `6_CODIGO_FONTE/sistema/publico/app.html`
- `6_CODIGO_FONTE/sistema/publico/admin.html`
- `6_CODIGO_FONTE/sistema/publico/manifest.json`
- `6_CODIGO_FONTE/sistema/publico/sw.js`
- `6_CODIGO_FONTE/sistema/servidor.js`
- `6_CODIGO_FONTE/sistema/teste.js`
- `6_CODIGO_FONTE/sistema/teste_api.js`
- `6_CODIGO_FONTE/sistema/README.md`
- `6_CODIGO_FONTE/INFO_ACESSO_E_ARQUITETURA.md`
