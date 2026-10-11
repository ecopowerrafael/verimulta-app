# Auditoria de equivalência React — VM-04.06

**Repositório:** `ecopowerrafael/verimulta-app`  
**Branch auditada:** `migration-react-typescript-capacitor`  
**Referência inicial:** `108518565ed5b7a73d58a28642dd0c51e05a3e7f`  
**Escopo:** comparação do HTML público, aplicativo autenticado, painel administrativo, documentos públicos, PWA e contratos Express.  
**Data:** 11/10/2026

## Critério de leitura

“Implementado” significa que há código correspondente e testes/compilação locais. “Pendente de navegador” significa que a verificação exige interação visual, foco, viewport ou APIs do navegador. “Pendente de VPS” significa que depende do Express, banco, credenciais, gateway, rate limit ou fontes externas reais. A auditoria não declara equivalência visual ou integração de produção sem essa evidência.

## Matriz de equivalência

| Original / funcionalidade | Legado | React / saída atual | Endpoints ou contrato | Estado e diferenças comprovadas | Evidência / pendência | Criticidade |
|---|---|---|---|---|---|---|
| Landing, hero, navegação, auditoria A1–A14, benefícios, planos, parceiros, FAQ, rodapé | `publico/index.html` | `frontend-react/index.html` + `src/landing-main.tsx` | Links estáticos; `/v1/consulta-placa/:placa` | HTML inicial preservado para SEO; interações em ilha React; lista de espera não envia sem endpoint | Build gera HTML inicial; comparar em navegador e no Netlify | alta |
| Consulta pública de placa | `index.html`, `consultarPlaca()` | `src/services/publicLanding.ts`, `landing-main.tsx` | `GET /v1/consulta-placa/:placa` | Valida placa, trata 429/erro/rede e não inventa dados oficiais | Testes de contrato; VPS precisa confirmar rate limit e resposta real | alta |
| Alternância mensal/anual | `index.html`, `.alterna` | `updatePrices()` + markup legado preservado | Dados `data-m`/`data-a` do HTML | Atualiza preços sem HTML não confiável | Teste unitário indireto; validar visualmente todos os cards | média |
| Lista de espera | `index.html`, `formEspera` | listener React em `landing-main.tsx` | Nenhum endpoint configurado | Não afirma cadastro concluído e não envia dados; botão mantém fluxo demonstrativo | Teste de navegador pendente; integração futura documentada | alta |
| Login e cadastro | `app.html` original, `t-login`, `t-cadastro` | `pages/auth/LoginPage.tsx`, `RegisterPage.tsx` | `POST /v1/auth/login`, `POST /v1/auth/register` | Consentimento e sessão preservados; links jurídicos adicionados; biometria explicitamente indisponível | Contratos em `verimultaApi.test.ts`; VPS precisa validar sessão real | alta |
| Início e indicadores do usuário | `t-home` | `pages/home/HomePage.tsx` | `GET /v1/veiculos`, `GET /v1/multas` | Veículo selecionado não é presumido; estados vazio e cadastro pendente presentes | Testes de sessão/veículo; visual e backend pendentes | alta |
| Captura/OCR | `t-scan`, `t-analise` | `ScanPage.tsx`, `AnalysisPage.tsx` | `POST /v1/multas/ler` | Upload passa pelo cliente HTTP; erro da leitura orienta preenchimento manual; análise é estado visual | Contrato tipado; execução com OCR/VPS pendente | alta |
| Confirmação e criação da multa | `t-confirmar` | `ConfirmPage.tsx` | `POST /v1/multas/scan` | Campos editáveis, placa selecionada e origem preservados | Contrato tipado; validar upload/banco real na VPS | alta |
| Diagnóstico/auditoria | `t-diag` | `DiagnosisPage.tsx` | `GET /v1/multas/:id/diagnostico` | Probabilidade/paywall/disclaimer vêm do backend; não há promessa de resultado | Testes de API; integração e PDF pendentes | alta |
| Defesa e histórico/PDF | `t-defesa`, `t-status` | `DefensePage.tsx`, `ResourcesPage.tsx` | `POST /v1/recursos`, `GET /v1/recursos`, `GET /v1/recursos/:id/pdf` | IDs preservados; download usa adaptação de Blob; atualização manual disponível | Contratos locais; autorização e PDF real pendentes | alta |
| Veículos | `t-veiculo` | `VehiclePage.tsx` | `GET /v1/veiculos`, `GET /v1/veiculos/:id/resumo` | Seleção explícita, resumo, vazio, erro e histórico | Testes de veículo/sessão; VPS pendente | alta |
| CNH | `t-cnh` | `CnhPage.tsx` | `GET /v1/cnh`, `POST /v1/cnh` | Pontos são somente das multas cadastradas; aviso diferencia Detran; validade editável | Contrato tipado; data e persistência reais pendentes | alta |
| Débitos/multas | `t-debitos` | `DebtsPage.tsx` | `GET /v1/multas` | Mostra registros do app, não débitos oficiais; SNE é identificado como simulação | Testes e texto revisados; VPS pendente | alta |
| Consultas oficiais | `t-consultas` | `OfficialConsultationsPage.tsx` | URLs em `officialConsultations.ts` | Navegação externa usa adaptador; não automatiza governo | Testes de URLs; abrir links e finalidade pendente | média |
| Dívida ativa | `t-divida` | `ActiveDebtPage.tsx` | Nenhum contrato real no backend | Campos desabilitados e consulta oficial indicada como indisponível | Não há integração a homologar; validar acessibilidade | média |
| Frota | `t-frota` | `FleetPage.tsx`, `PlansPage.tsx` | Nenhum endpoint operacional; `GET /v1/planos` só informa catálogo | Dados demonstrativos marcados; plano Frota aparece, mas proposta/checkout permanecem desabilitados | Contrato futuro e visual pendentes | alta |
| Rede de prestadores | `t-rede` | `NetworkPage.tsx` | Nenhum endpoint de diretório | Exemplos não verificados, ações desabilitadas e aviso de ausência de integração | Nenhum parceiro real declarado; visual pendente | alta |
| Parceiro | `t-parceiro` | `PartnerPage.tsx` | Nenhum endpoint de credenciamento/pagamento | Preços preservados como conteúdo demonstrativo; nenhum dado coletado; botão indisponível | Aprovação comercial e endpoint futuros | alta |
| Planos e checkout | `t-planos` | `PlansPage.tsx` | `GET /v1/planos`, `POST /v1/checkout` | Planos fixos usam catálogo do backend; Frota só exibe proposta não conectada; ativação depende de webhook | Testes de contrato; gateway e webhook na VPS | alta |
| Perfil/LGPD/cancelamento | `t-perfil` | `ProfilePage.tsx` | `POST /v1/assinaturas/cancelar`, `GET /v1/eu/dados`, `DELETE /v1/eu/conta` | Confirmação de exclusão, download e logout preservados | Dados reais e retenção LGPD pendentes | alta |
| Feedback | `t-feedback` | `FeedbackPage.tsx` | `GET /v1/feedback`, `POST /v1/feedback` | Nota/comentário, validação, histórico, falha separada e sem HTML inseguro | Testes de fluxo; sessão real pendente | alta |
| Transparência | `t-transparencia` | `TransparencyPage.tsx` | Nenhum endpoint | Avisos legais, estimativa e limitações preservados | Comparação visual e revisão jurídica pendentes | alta |
| Navegação, voltar, logout | barra `navbar`, `go()` e histórico legado | `AppBottomNavigation.tsx`, `navigationState.ts`, `App.tsx` | `history.pushState`, `popstate` | Seções ativas, volta segura e descarte de sessão antiga implementados | Testar browser real, recarga e back/forward | alta |
| Painel administrativo | `publico/admin.html` | `admin.html`, `pages/admin/AdminApp.tsx` | `/v1/admin/resumo`, `/v1/admin/feedbacks`, tarefas | Cliente isolado, chave em memória, confirmação, refresh separado, geração de sessão | 49 testes; chave compartilhada, VPS e visual pendentes | bloqueante para produção |
| Termos, privacidade, instalação | `termos.html`, `privacidade.html`, `instalar.html` | `frontend-react/public/*.html` | Links estáticos | Conteúdo copiado sem reescrita jurídica | Validar URLs/links no deploy | alta |
| Manifest, ícones, SW, robots | `manifest.json`, `sw.js`, `icones`, `robots.txt` | `frontend-react/public/` | PWA estático | Cache agora exclui `/v1`, admin e requisições autenticadas; cache versionado `v2` | Testar instalação/offline/update em navegador | alta |

## Correções aplicadas nesta auditoria

- Removida a segunda `meta description` da landing.
- Corrigido o service worker: respostas de API, checkout, `/v1/admin`, requisições com `Authorization` e `x-admin-secret` não são cacheadas.
- Cache público versionado para evitar conflito com `verimulta-v1`.
- Botão de biometria deixou de ser um controle sem ação e passou a informar indisponibilidade.
- Labels do cadastro passaram a possuir IDs estáveis e os links para Termos/Privacidade ficaram funcionais.
- O plano Frota voltou a aparecer na tela React, mas permanece sem checkout porque o contrato real não aceita `preco_veiculo`.
- Adicionado `prefers-reduced-motion` à landing para rolagem e transições.

## Lacunas e riscos

- A equivalência visual nos seis tamanhos solicitados não foi aprovada por captura/comparação em navegador neste ambiente.
- A autenticação administrativa continua sendo uma chave compartilhada, sem identidade individual, RBAC e auditoria de operação.
- A lista de espera não possui endpoint e não pode receber leads ainda.
- Consultas oficiais, rede, parceiros, frota operacional e dívida ativa continuam dependentes de contratos/credenciamento.
- Checkout, webhook, OCR, PDF, rate limit e sessão real continuam pendentes de VPS.
- A idempotência durável de tarefas administrativas ainda precisa ser definida no backend.

## Evidências locais

- `npm run typecheck`: passou.
- `npm test`: 52 testes passaram.
- `npm run build`: passou; gera `index.html`, `app.html`, `admin.html` e recursos públicos.
- Nenhum HTML legado, backend, banco ou deploy foi alterado nesta auditoria.

## Recomendação

A Etapa 04 não deve ser declarada homologada nem pronta para produção. A Etapa 05 só deve começar após registrar e priorizar as pendências bloqueantes de VPS, autenticação administrativa, pagamentos/webhook, PWA, comparação visual e integrações oficiais. A preparação técnica pode ser revisada, mas não há evidência suficiente para tratar o produto como pronto para produção.
