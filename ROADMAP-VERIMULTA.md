# VERIMULTA — Roadmap geral de desenvolvimento

## Visão do produto

O VeriMulta é uma aplicação SaaS para consulta, auditoria e preparação de defesas administrativas relacionadas a multas de trânsito. O sistema mantém um backend Node.js/Express com SQLite na base atual, uma interface HTML legada e uma nova base React + TypeScript + Vite preparada para futura distribuição via Capacitor.

Princípios de evolução:

- preservar o backend, regras de auditoria, jurimetria, planos e integração financeira existentes;
- preservar o HTML legado até a substituição ser comprovada por homologação;
- manter o backend como autoridade para autenticação, autorização, tenant, assinatura e benefícios;
- não declarar integração, segurança ou equivalência visual sem evidência correspondente;
- publicar desenvolvimento somente em `https://github.com/ecopowerrafael/verimulta-app`;
- não modificar `https://github.com/agendaprimecorp-lgtm/verimulta`.

## Estado global

**Data da revisão:** 11/10/2026

**Branch de desenvolvimento:** `migration-react-typescript-capacitor`

**Commit de referência:** `f79347aa3a76c2706aed641b5ba0ed8e6a9e7673`

**Estado atual:** Etapas 01 e 02 concluídas; Etapa 03 em andamento, com validação local leve aprovada e integração real com Express/VPS pendente. Etapas 04–11 ainda não iniciadas.

---

## Etapa 01 — Auditoria e planejamento

**Status:** concluída.

### Checklist

- [x] Mapear HTML legado, frontend isolado e backend Node.js/Express.
- [x] Identificar endpoints, autenticação JWT, SQLite, planos e integração financeira.
- [x] Registrar riscos de tenant, credenciais, webhooks, banco e toolchain nativa.
- [x] Definir migração incremental, sem substituir o legado prematuramente.

### Evidências

- `6_CODIGO_FONTE/sistema/servidor.js` e módulos relacionados foram usados como contrato do backend.
- `PLANO-MIGRACAO-REACT-CAPACITOR.md` registra o diagnóstico inicial e a estratégia incremental.
- `PENDENCIAS-HOMOLOGACAO-VPS.md` mantém os critérios operacionais ainda não validados.

### Pendências

- Revalidar contratos em cada etapa quando houver mudança de backend ou dados reais.

### Critérios de aceite

- Arquitetura, riscos, limites de escopo e ordem de migração documentados.
- Nenhuma alteração de produto baseada em contexto inventado.

---

## Etapa 02 — Fundação React e GitHub

**Status:** concluída para a base inicial.

### Checklist

- [x] Criar frontend React + TypeScript + Vite isolado.
- [x] Preservar HTML legado e backend sem substituição prematura.
- [x] Centralizar cliente HTTP, armazenamento de sessão, tipos e integrações web.
- [x] Criar testes unitários/contratuais iniciais.
- [x] Configurar exclusões de segredos, bancos, dependências e artefatos.
- [x] Publicar a branch de migração no repositório próprio.

### Evidências

- Commit inicial da base: `6c2062a99d149e1133e833bcbf109081f8721ffc`.
- Commit da primeira correção crítica: `beaa5e53e63b8f6351ddaed2f94a819c819b7ead`.
- Publicação confirmada no remote `meu-github`.
- `origin` continua apontando para o repositório do cliente.

### Pendências

- A base ainda precisa ser homologada contra o Express real antes de substituir qualquer jornada legada.

### Critérios de aceite

- Projeto React compila com TypeScript strict.
- Histórico Git e branch de migração preservados.
- Nenhum segredo, banco, backup, `node_modules` ou `dist` versionado.

---

## Etapa 03 — Correções da base e validação leve

**Status:** em andamento; não homologada integralmente.

### Checklist

- [x] Corrigir autenticação antes do cadastro de veículo.
- [x] Tratar falha parcial sem perder a conta criada.
- [x] Persistir recuperação de veículo pendente por usuário, sem guardar credenciais adicionais.
- [x] Evitar duplicidade de placa em recuperação.
- [x] Sincronizar expiração de sessão HTTP 401 com o estado visual.
- [x] Impedir que respostas de sessões antigas alterem a sessão atual.
- [x] Separar `multa_id` de `recurso_id` na criação e abertura de defesa.
- [x] Não forçar `plano: gratis` após cancelamento.
- [x] Documentar a ausência de endpoint real de identidade da sessão.
- [x] Executar typecheck, testes leves e build local.
- [ ] Executar integração HTTP contra Express e banco descartável na VPS.
- [ ] Homologar cancelamento, vigência e identidade autenticada no backend real.

### Evidências

- `ApiClient` compara o token capturado com o token atual antes de invalidar a sessão.
- `pendingVehicleStorage` usa chave vinculada ao `usuario.id` e guarda somente placa/modelo pendentes.
- `ensureVehicle()` consulta veículos antes de criar.
- Recursos existentes usam `GET /v1/recursos/:id/pdf`; não criam defesa duplicada.
- Commit funcional: `beaa5e53e63b8f6351ddaed2f94a819c819b7ead`.
- Commit documental: `f79347aa3a76c2706aed641b5ba0ed8e6a9e7673`.
- Ajustes VM-03.06: `376bae8e0fd3df180a944ff6abff430ab9613baa`.
- `npm run typecheck`: passou.
- `npm test`: 17 testes passaram.
- `npm run build`: passou.

### Pendências e riscos

- O backend atual não oferece `GET /v1/eu` ou equivalente para confirmar identidade e plano vigentes.
- O cancelamento retorna apenas `ok` e `mensagem`; não distingue solicitação, vigência e término.
- O Express real não foi executado neste computador por dependência nativa do SQLite.
- A validação visual lado a lado e as jornadas reais permanecem pendentes.

### Critérios de aceite

- Correções locais cobertas por testes e sem regressão de typecheck/build.
- Nenhum item de integração marcado como aprovado apenas por teste isolado.
- Etapa permanece aberta até a homologação na VPS.

---

## Etapa 04 — Conclusão do frontend React

**Status:** em andamento; VM-04.01, VM-04.02, VM-04.03, VM-04.03.1 e VM-04.04 implementadas e testadas localmente. Integração real pendente.

### Checklist

- [ ] Inventariar todas as telas e jornadas restantes do HTML legado.
- [ ] Migrar telas em fatias verticais, preservando tokens, layouts e comportamento.
- [ ] Completar estados de carregamento, erro, vazio, paywall e permissões.
- [ ] Cobrir acessibilidade básica, teclado, foco e mensagens de erro.
- [ ] Validar viewports 320/360/390/430 px e desktop.
- [ ] Comparar visualmente React e legado com evidência reproduzível.

### Evidências

- A base atual cobre a primeira jornada de autenticação, multa, diagnóstico, recursos, planos e perfil em nível isolado.

### Pendências

- Dependente da conclusão e homologação da Etapa 03.

### Critérios de aceite

- Todas as jornadas priorizadas possuem equivalente React testado.
- Nenhuma divergência visual ou funcional crítica sem decisão registrada.
- HTML legado continua disponível para rollback.

### VM-04.01 — Veículos, CNH, débitos e consultas oficiais

**Status:** implementada e testada localmente; não homologada contra o Express real.

#### Checklist

- [x] Migrar `t-veiculo` com seleção explícita, resumo e histórico do veículo.
- [x] Integrar `GET /v1/veiculos` e `GET /v1/veiculos/:id/resumo`.
- [x] Usar o veículo selecionado, sem assumir a primeira posição da lista.
- [x] Migrar `t-cnh` com pontos, limite, janela, situação e validade.
- [x] Integrar `GET /v1/cnh` e `POST /v1/cnh`.
- [x] Migrar `t-debitos` usando somente multas retornadas por `GET /v1/multas`.
- [x] Migrar `t-consultas` com os sete links oficiais do HTML legado.
- [x] Usar o adaptador de navegação externa existente.
- [x] Cobrir contratos de veículo/CNH e preservar URLs oficiais em testes.
- [ ] Homologar os quatro fluxos com Express, banco descartável e sessão real na VPS.

#### Evidências

- Componentes: `frontend-react/src/pages/veiculo/VehiclePage.tsx`, `cnh/CnhPage.tsx`, `debito/DebtsPage.tsx` e `consulta/OfficialConsultationsPage.tsx`.
- Contratos: `frontend-react/src/services/verimultaApi.ts` e `frontend-react/src/services/verimultaApi.test.ts`.
- Links centralizados em `frontend-react/src/integrations/officialConsultations.ts`.
- Nenhuma consulta governamental foi automatizada ou apresentada como resultado oficial.

#### Pendências

- Validar respostas reais, autorização por usuário, estados de erro e visual nos viewports da VPS/homologação.
- Validar que a fonte oficial do backend continua desligada/explicada quando não houver credenciamento.

#### Critérios de aceite

- Quatro telas acessíveis pela jornada React, com estados vazio, carregamento e erro.
- IDs de veículo e multa preservados nos endpoints seguintes.
- Dados oficiais não inventados e links externos mantidos no adaptador.
- HTML legado permanece disponível e sem alterações.

### VM-04.02 — Dívida ativa, frota, rede e parceiros

**Status:** implementada e testada localmente; integrações reais pendentes.

#### Correções da VM-04.01

- [x] SNE apresentado como simulação de até 40%, condicionado à elegibilidade, sem alterar o backend.
- [x] Erros de veículo e CNH descartados quando pertencem a uma sessão antiga.
- [x] Seleção de veículo preservada; confirmação continua respeitando o contrato real, que permite associação opcional.
- [x] Testes de resposta atrasada e troca de usuário adicionados.

#### Telas migradas

- [x] `t-divida`: campos e aviso do legado preservados, sem envio porque não existe consulta real de dívida ativa.
- [x] `t-frota`: cards, restrição de plano e valores demonstrativos preservados, identificados como exemplo sem gestão operacional conectada.
- [x] `t-rede`: categorias e cartões do legado preservados como exemplos não verificados; contato não simula ação real.
- [x] `t-parceiro`: categorias, preços e periodicidades preservados; credenciamento permanece indisponível sem endpoint.
- [x] Navegação de ida e volta integrada à jornada React.

#### Evidências e pendências

- Componentes: `frontend-react/src/pages/divida/ActiveDebtPage.tsx`, `frota/FleetPage.tsx`, `rede/NetworkPage.tsx` e `parceiro/PartnerPage.tsx`.
- Não existem no backend atual endpoints de dívida ativa, frota operacional, rede credenciada ou credenciamento de parceiros.
- Nenhum resultado oficial, parceiro real, cobrança ou sucesso de credenciamento foi inventado.
- `npm run typecheck`: passou.
- `npm test`: 23 testes passaram.
- `npm run build`: passou.
- Homologação com backend real, comparação visual e acessibilidade em viewports reais continuam pendentes na VPS.

#### Critérios de aceite

- Quatro telas acessíveis sem alterar HTML legado ou backend.
- Funcionalidades demonstrativas identificadas de forma explícita.
- Nenhum dado pessoal coletado sem destino funcional.
- VM-04.05 não iniciada.

### VM-04.03 — Feedback, transparência e navegação

**Status:** implementada e testada localmente; integração real e comparação visual na VPS pendentes.

#### Checklist

- [x] Migrar `t-feedback` com nota, comentário, validações, envio e histórico do próprio usuário.
- [x] Integrar `GET /v1/feedback` e `POST /v1/feedback` sem enviar `nota: null` ao backend.
- [x] Migrar `t-transparencia` preservando os textos e avisos legais do HTML legado.
- [x] Criar barra inferior global para Início, Recursos, Verificar, Rede e Perfil.
- [x] Indicar a seção ativa e preservar navegação por botão voltar e histórico do navegador.
- [x] Corrigir preços demonstrativos da frota conforme `planos.js` e remover nomes fictícios da rede.
- [x] Cobrir contratos, validações, navegação e isolamento de sessão com testes leves.

#### Evidências e pendências

- Componentes: `frontend-react/src/pages/feedback/FeedbackPage.tsx`, `transparencia/TransparencyPage.tsx` e `components/AppBottomNavigation.tsx`.
- O backend limita comentário a 4000 caracteres, nota a 1–5 e lista somente feedbacks do usuário autenticado.
- A seleção de nota sem comentário e comentário sem nota são suportados; envio só é confirmado após resposta de sucesso.
- A barra global não foi adicionada às telas de autenticação/análise, conforme `TELAS_SEM_NAV` do legado.
- `npm run typecheck`: passou.
- `npm test`: 34 testes passaram.
- `npm run build`: passou.
- Ainda pendentes: homologação contra Express real, comparação visual, teclado/leitor de tela e botão voltar em navegador real.

#### Critérios de aceite

- Feedback não duplica envio enquanto a requisição está em andamento e não renderiza HTML não confiável.
- Respostas de feedback de sessão antiga não alteram a sessão atual.
- Transparência não cria promessas jurídicas ou resultados inexistentes.
- VM-04.05 não iniciada.

### VM-04.03.1 — Correção de feedback e navegação

**Status:** implementada e testada localmente; homologação real pendente.

#### Correções

- [x] Campos de feedback só são limpos após confirmação explícita de sucesso do fluxo.
- [x] Falhas HTTP, timeout e rede preservam nota e comentário.
- [x] Falha ao atualizar o histórico após envio confirmado gera aviso separado, sem tratar o envio como falho.
- [x] Envios duplicados são bloqueados durante a requisição e não há reenvio automático.
- [x] `popstate` valida sessão, usuário atual e dados necessários para diagnóstico/defesa.
- [x] Logout e expiração usam `replaceState` e removem o acesso visual às telas protegidas.
- [x] Entradas duplicadas da mesma tela não são adicionadas ao histórico.

#### Evidências

- Fluxo explícito: `frontend-react/src/services/feedbackFlow.ts`.
- Guarda de histórico: `frontend-react/src/services/navigationState.ts`.
- Testes de sucesso/falha/histórico e navegação adicionados; 34 testes passaram.
- Nenhum backend ou HTML legado foi alterado.

#### Pendências

- Confirmar essas jornadas contra Express real, sessão real e navegador real na VPS.
- Validar recarregamento, botão voltar, foco e acessibilidade em todos os viewports.
- VM-04.05 não iniciada.

### VM-04.04 — Painel administrativo React

**Status:** implementada e testada localmente; integração real e homologação de segurança pendentes.

#### Checklist

- [x] Criar entrada React separada em `admin.html`, sem acoplar o painel à aplicação do usuário.
- [x] Migrar indicadores, usuários, pagamentos, multas, emails, feedbacks e varreduras com os campos reais de `GET /v1/admin/resumo` e `GET /v1/admin/feedbacks`.
- [x] Integrar as tarefas manuais `POST /v1/admin/tarefas/prazos` e `POST /v1/admin/tarefas/varredura` com confirmação, carregamento e bloqueio de duplicidade.
- [x] Manter `x-admin-secret` somente em memória, sem localStorage, sessionStorage, URL, logs ou reaproveitamento do JWT do usuário.
- [x] Tratar 401/403, estados vazios, erro, carregamento e limpeza da credencial ao sair.
- [x] Preservar tokens visuais do painel legado e tabelas responsivas sem biblioteca de interface.
- [x] Adicionar testes leves de contrato, autorização, limpeza de credencial e estado de tarefas.
- [ ] Homologar o painel com `ADMIN_SECRET` real, resposta do Express, controle de acesso e comparação visual na VPS.

#### Evidências e limitações

- Componentes: `frontend-react/src/pages/admin/AdminApp.tsx`, `admin-main.tsx` e `styles/admin.css`.
- Serviço isolado: `frontend-react/src/services/adminApi.ts`; tipos em `frontend-react/src/types/admin.ts`.
- O backend atual protege o painel por chave compartilhada `x-admin-secret`, sem identidade individual, RBAC ou auditoria de ações; isso permanece uma limitação operacional documentada, não uma autorização para criar autenticação paralela no frontend.
- O painel não executa tarefas automaticamente ao abrir e não usa `dangerouslySetInnerHTML`.
- HTML legado, backend, banco e entradas públicas não foram alterados.

#### Critérios de aceite

- Painel acessível pela entrada React independente, com os contratos reais e sem dados fictícios.
- Credencial removida ao sair e respostas 401/403 não expõem segredo nem permanecem na sessão visual.
- Nenhuma integração administrativa é declarada homologada antes da validação na VPS.

---

## Etapa 05 — Backend e banco em nuvem

**Status:** planejada; não iniciada.

### Checklist

- [ ] Definir ambiente de backend e banco gerenciado/adequado.
- [ ] Planejar migrações, índices, constraints, backup e rollback.
- [ ] Validar isolamento de usuário/tenant em todas as consultas.
- [ ] Configurar secrets fora do repositório.
- [ ] Definir observabilidade, health check, timeout e retenção de logs.
- [ ] Executar migração progressiva sem perda de dados.

### Evidências

- O backend atual usa SQLite e módulos Node.js/Express no diretório `6_CODIGO_FONTE/sistema`.

### Pendências

- Não escolher provedor ou alterar banco sem requisitos de produção, volume e rollback definidos.

### Critérios de aceite

- Dados existentes preservados e restauráveis.
- Segurança, tenant isolation, backups e operação comprovados em ambiente de homologação.

---

## Etapa 06 — Assinaturas comerciais

**Status:** planejada; não iniciada.

### Checklist

- [ ] Definir estados de assinatura e vigência no backend.
- [ ] Confirmar planos, limites e preços em fonte única.
- [ ] Validar checkout, retorno e ativação somente por webhook confiável.
- [ ] Implementar idempotência, replay protection e processamento fora de ordem.
- [ ] Definir cancelamento imediato versus fim de período.
- [ ] Exibir no frontend somente estado efetivo do servidor.

### Evidências

- O backend possui `/v1/planos`, `/v1/checkout`, webhooks e cancelamento.

### Pendências

- Contrato atual de cancelamento não informa vigência nem estado detalhado.

### Critérios de aceite

- Nenhum benefício é liberado por estado local.
- Webhooks duplicados, atrasados, inválidos e fora de ordem são seguros.
- Financeiro e auditoria permanecem rastreáveis.

---

## Etapa 07 — Homologação integrada na VPS

**Status:** planejada; bloqueada até ambiente adequado.

### Checklist

- [ ] Instalar dependências backend em Node compatível.
- [ ] Usar banco descartável e identificado.
- [ ] Executar testes backend e API.
- [ ] Subir Express e frontend com configuração de homologação.
- [ ] Validar autenticação, cadastro, 401, veículos, multas, OCR, diagnóstico e defesa.
- [ ] Validar assinaturas, webhooks, LGPD, isolamento e concorrência.
- [ ] Registrar logs, evidências e rollback.

### Evidências

- `PENDENCIAS-HOMOLOGACAO-VPS.md` contém o checklist operacional detalhado.

### Pendências

- O ambiente local não possui toolchain nativa compatível com `better-sqlite3`.

### Critérios de aceite

- Jornadas críticas executadas contra backend real, sem banco de produção.
- Todos os riscos críticos têm evidência ou plano de correção aprovado.

---

## Etapa 08 — Capacitor Android/iOS

**Status:** planejada; não iniciada.

### Checklist

- [ ] Confirmar que o frontend web está homologado.
- [ ] Definir armazenamento seguro de sessão nativo.
- [ ] Integrar câmera, arquivos, navegação externa e downloads.
- [ ] Tratar ciclo de vida, suspensão, retomada, deep links e botão voltar.
- [ ] Configurar builds reproduzíveis e assinaturas fora do repositório.
- [ ] Testar em dispositivos reais.

### Evidências

- A camada web já separa transferência de arquivos e navegação externa.

### Pendências

- Não instalar Capacitor nativo antes das Etapas 03, 04 e 07.

### Critérios de aceite

- Paridade funcional web/mobile comprovada nos fluxos prioritários.
- Credenciais armazenadas com mecanismo seguro da plataforma.

---

## Etapa 09 — Publicação web

**Status:** planejada; não iniciada.

### Checklist

- [ ] Definir pipeline de build e artefatos.
- [ ] Configurar domínio, HTTPS, CORS e variáveis de ambiente.
- [ ] Publicar frontend sem segredos no bundle.
- [ ] Configurar rollback para HTML legado.
- [ ] Validar observabilidade, cache, headers e health checks.

### Evidências

- Build Vite local já é executável, mas não representa publicação de produção.

### Pendências

- Deploy não autorizado nesta etapa e ainda sem critérios de produção aprovados.

### Critérios de aceite

- Publicação reproduzível, reversível e monitorada.
- Backend e frontend usam contratos/versionamento compatíveis.

---

## Etapa 10 — Publicação Google Play e App Store

**Status:** planejada; não iniciada.

### Checklist

- [ ] Definir contas, certificados, identificadores e políticas de privacidade.
- [ ] Gerar builds assinados em ambiente controlado.
- [ ] Validar permissões, câmera, arquivos e links externos.
- [ ] Preparar metadados, screenshots e suporte.
- [ ] Executar distribuição interna antes da publicação pública.

### Evidências

- Nenhum pacote nativo ou emulador foi criado, conforme restrições atuais.

### Pendências

- Depende da Etapa 08 e da homologação integrada.

### Critérios de aceite

- Builds assinados e rastreáveis.
- Testes internos aprovados sem regressões críticas e com rollback definido.

---

## Etapa 11 — Estabilização e entrega

**Status:** planejada; não iniciada.

### Checklist

- [ ] Monitorar erros, desempenho, pagamentos, webhooks e suporte.
- [ ] Corrigir regressões sem reescrever histórico ou quebrar contratos.
- [ ] Consolidar documentação operacional e técnica.
- [ ] Treinar operação e definir responsáveis.
- [ ] Encerrar migração somente após período de estabilidade comprovado.

### Evidências

- Ainda não há publicação de produção nem período de estabilidade.

### Pendências

- Todas as etapas anteriores e seus critérios de aceite.

### Critérios de aceite

- Sistema monitorado, rollback testado, documentação entregue e responsabilidades transferidas.
- HTML legado aposentado somente após evidência de equivalência e estabilidade.

---

## Histórico preservado — VM-03.01 a VM-03.05

### VM-03.01 — Autenticação durante o cadastro

- Sessão persistida antes de chamadas autenticadas.
- `ensureVehicle()` consulta veículos antes de criar.
- Falha parcial mantém a conta ativa e oferece conclusão posterior.
- Integração com Express ainda pendente.

### VM-03.02 — Expiração da sessão

- HTTP 401 da sessão atual limpa credencial e estado visual.
- 401 do login não é tratado como expiração.
- Resposta atrasada de token antigo não encerra sessão nova.

### VM-03.03 — Identificação da multa na defesa

- `POST /v1/recursos` recebe `multa_id`.
- PDF existente usa `recurso_id` em `GET /v1/recursos/:id/pdf`.
- A lista não cria defesa duplicada.

### VM-03.04 — Cancelamento de assinatura

- Frontend não força `plano: gratis`.
- A ação é bloqueada após sucesso na sessão atual.
- Contrato backend ainda não distingue vigência, solicitação e término.

### VM-03.05 — Restauração da sessão

- Dados locais só iniciam chamadas autenticadas; não são considerados prova suficiente de identidade do servidor.
- Falta endpoint de identidade mínima, como `GET /v1/eu`.
- Nenhum endpoint fictício foi criado.

### Evidências da VM-03

- Implementação: `beaa5e53e63b8f6351ddaed2f94a819c819b7ead`.
- Registro documental e push: `f79347aa3a76c2706aed641b5ba0ed8e6a9e7673`.
- Ajustes finais de persistência e isolamento: `376bae8e0fd3df180a944ff6abff430ab9613baa`.
- Testes locais anteriores: typecheck passou, 17 testes passaram e build Vite passou.
- Nenhum teste de integração real com Express foi declarado aprovado.

## Próxima sequência recomendada

Não iniciar a VM-04.05 automaticamente. Após a homologação das VMs 04.01, 04.02, 04.03, 04.03.1 e 04.04 na VPS, a próxima sequência recomendada da Etapa 04 é:

1. concluir estados de erro, carregamento, vazio e paywall da jornada já migrada;
2. migrar a tela de recursos/perfil com comparação visual formal e acessibilidade;
3. migrar as telas restantes do HTML legado por fatias verticais, sempre preservando tokens e contratos;
4. só então preparar Capacitor.
