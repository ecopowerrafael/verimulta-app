# VERIMULTA — VM-03: Correções críticas da base React

Atue como engenheiro de software sênior responsável pela evolução do VeriMulta.

Estamos desenvolvendo uma aplicação SaaS com React + TypeScript + Vite, preparada para distribuição futura por Capacitor no Android e iOS.

O objetivo é preservar integralmente a identidade visual e as funcionalidades do HTML original, mantendo o backend Node.js/Express.

## Repositórios

**Desenvolvimento:**
`https://github.com/ecopowerrafael/verimulta-app`

**Repositório original do cliente (não modificar):**
`https://github.com/agendaprimecorp-lgtm/verimulta`

**Branch de trabalho:**
`migration-react-typescript-capacitor`

## 1. Incorporar o roadmap

Estou enviando o arquivo `ROADMAP-VERIMULTA.md`.

Antes de qualquer implementação:

1. Ler integralmente o roadmap fornecido.
2. Colocar o arquivo na raiz do repositório local, preservando seu conteúdo e organização.
3. Conferir o Git e a branch atual.
4. Conferir o commit de referência `6c2062a`.
5. Verificar se existem alterações locais não publicadas.
6. Não substituir arquivos existentes sem conferir possíveis diferenças.
7. Usar o roadmap como documento central de acompanhamento do projeto.

O roadmap deverá ser atualizado ao finalizar cada tarefa, registrando o estado real, evidências, testes e commits.

Não marcar uma atividade como aprovada se ela foi apenas implementada, mas não testada contra o backend real.

## 2. VM-03.01 — Corrigir autenticação durante o cadastro

Arquivo principal:
`frontend-react/src/app/App.tsx`

Problema identificado:

O cadastro permite informar uma placa. Atualmente, o frontend tenta criar o veículo antes de estabelecer a sessão do usuário, fazendo a chamada potencialmente sem o JWT necessário.

Investigar o fluxo completo e corrigir.

Requisitos:

- Cadastro retorna usuário e token.
- A credencial precisa estar disponível antes de realizar operações autenticadas.
- O cadastro de veículo deve utilizar o token correto.
- Se o cadastro do usuário funcionar e o veículo falhar, não tratar o cadastro inteiro como inexistente.
- Apresentar mensagem coerente e permitir completar o veículo posteriormente.
- Não criar contas ou veículos duplicados em tentativas de recuperação.
- Não expor credenciais nos logs.

Adicionar testes para sucesso e falha parcial.

## 3. VM-03.02 — Corrigir expiração da sessão

Arquivos principais:
`apiClient.ts`, `storage.ts` e `App.tsx`.

Problema:

Ao receber HTTP 401, o cliente HTTP limpa as credenciais, mas a aplicação React pode continuar apresentando uma tela autenticada.

Implementar sincronização adequada entre autenticação e estado visual.

Requisitos:

- HTTP 401 de sessão autenticada deve invalidar a sessão correspondente.
- Limpar dados pessoais mantidos no estado da aplicação.
- Redirecionar o usuário ao login.
- Apresentar mensagem apropriada.
- Evitar loops de redirecionamento.
- Diferenciar credenciais inválidas no login de expiração de sessão existente.
- Evitar que uma resposta atrasada de sessão antiga encerre uma sessão nova.

Não introduzir bibliotecas pesadas de estado global.

Adicionar testes específicos.

## 4. VM-03.03 — Corrigir identificação da multa na geração de defesa

Investigar a integração entre:

- Lista de recursos.
- Geração de defesa.
- Identificador da multa.
- Identificador do recurso.
- Endpoint `POST /v1/recursos`.

O código atual passa um identificador para `createDefense()` a partir da lista de recursos.

Confirmar pelo contrato real do backend se a operação espera `multa_id` ou `recurso_id`.

Não presumir que os identificadores são intercambiáveis.

Corrigir a navegação e a associação quando necessário.

Se um recurso já existe, verificar se a ação correta é abrir sua defesa existente, em vez de criar outra.

Adicionar testes que utilizem IDs diferentes para multa e recurso, identificando qualquer associação incorreta.

Não modificar o backend sem necessidade comprovada.

## 5. VM-03.04 — Corrigir representação do cancelamento de assinatura

Investigar o contrato real do endpoint de cancelamento.

Problema:

O frontend atualmente define o plano do usuário como `gratis` após receber uma resposta de cancelamento.

Isso pode divergir do estado real da assinatura, especialmente quando o cancelamento ocorrer ao final do período pago.

Requisitos:

- Não inventar o estado da assinatura no frontend.
- Utilizar a resposta efetiva do servidor.
- Se o contrato atual não informar suficientemente o estado, registrar a necessidade de ajuste no backend.
- Diferenciar solicitação de cancelamento, cancelamento confirmado e término da vigência quando esses estados forem suportados.
- Não liberar ou bloquear benefícios com base apenas em alterações locais.
- Impedir múltiplos envios acidentais.

Adicionar testes usando respostas compatíveis com o contrato existente.

## 6. VM-03.05 — Revisar restauração da sessão

O React atualmente restaura informações locais do usuário.

Revisar o comportamento sem alterar o backend nesta etapa.

Verificar se existe endpoint capaz de retornar a identidade autenticada e o plano vigente.

Se não existir, documentar uma proposta para `GET /v1/eu` ou endpoint equivalente, com contrato mínimo e critérios de segurança.

Não criar endpoint fictício nem declarar a sessão validada pelo servidor sem uma requisição real.

## 7. Testes leves

Este computador possui pouca memória RAM.

Portanto:

- Não utilizar Docker.
- Não instalar Visual Studio ou compiladores C++.
- Não executar backend SQLite local.
- Não instalar emulador Android.
- Não executar testes de carga.
- Não instalar Capacitor nativo ainda.

Executar sequencialmente, quando compatível com a máquina:

- `npm run typecheck`
- `npm test`
- `npm run build`

Executar somente testes isolados e de contrato nesta etapa.

A integração real será homologada posteriormente na VPS.

## 8. Restrições arquiteturais

- Preservar o HTML legado.
- Preservar a identidade visual.
- Não alterar regras de auditoria ou jurimetria.
- Não modificar o banco de dados.
- Não modificar planos ou preços.
- Não alterar a integração financeira de produção.
- Não adicionar bibliotecas desnecessárias.
- Manter TypeScript strict.
- Evitar componentes monolíticos e regras duplicadas.
- Não criar mocks no fluxo de produção.

## 9. Atualização do roadmap

Após concluir as correções:

1. Atualizar os itens VM-03.01 a VM-03.05.
2. Distinguir implementado, testado localmente e pendente de integração.
3. Registrar os testes executados.
4. Registrar riscos ou problemas remanescentes.
5. Manter a Etapa 03 aberta enquanto houver critérios de homologação pendentes.
6. Atualizar também `PENDENCIAS-HOMOLOGACAO-VPS.md` com os testes que precisarão ser repetidos na VPS.

## 10. GitHub

Após concluir as implementações e verificações:

1. Revisar `git diff`.
2. Verificar arquivos sensíveis.
3. Criar um commit descritivo na branch atual.
4. Fazer push exclusivamente para `meu-github`.
5. Não modificar o repositório original do cliente.
6. Não realizar deploy.
7. Não utilizar `--force`.

Usar o Git Credential Manager existente para autenticação, já que o push HTTPS funcionou anteriormente.

Não exigir novo login apenas porque `gh auth status` apresentar token inválido.

## 11. Relatório final

Apresentar:

- Roadmap incorporado.
- Tarefas corrigidas.
- Arquivos alterados.
- Testes executados e resultados.
- Pontos ainda não homologados.
- Commit SHA.
- Confirmação do push para `ecopowerrafael/verimulta-app`.
- Próxima tarefa recomendada.

Não iniciar automaticamente a Etapa 04.

O objetivo é concluir correções pequenas, confiáveis e revisáveis antes de prosseguir.

## Status VM-03 — 11/10/2026

### VM-03.01 — Autenticação durante o cadastro

- **Implementado:** a sessão recebida no cadastro é persistida antes de qualquer chamada autenticada.
- **Implementado:** a placa é consultada antes da criação para evitar duplicidade em recuperação; falha no veículo mantém a conta ativa e exibe uma ação de conclusão na tela inicial.
- **Testado localmente:** cobertura contratual para veículo já existente, criação após consulta e recuperação sem duplicação.
- **Pendente de integração:** cadastro, JWT e falha parcial ainda precisam ser executados contra o Express real na VPS.

### VM-03.02 — Expiração da sessão

- **Implementado:** `ApiClient` invalida a sessão somente quando o HTTP 401 pertence ao token ainda armazenado.
- **Implementado:** a aplicação limpa o modelo pessoal, retorna ao login e informa a expiração; 401 de login não é tratado como expiração.
- **Implementado:** resposta atrasada de sessão antiga não limpa uma sessão nova.
- **Testado localmente:** cenários de 401 autenticado, 401 de login e resposta atrasada; typecheck, testes e build verdes.
- **Pendente de integração:** validação ponta a ponta com token expirado no backend real.

### VM-03.03 — Identificação da multa na defesa

- **Confirmado pelo backend:** `POST /v1/recursos` recebe `multa_id`; `GET /v1/recursos/:id/pdf` recebe o `id` do recurso.
- **Implementado:** diagnóstico cria defesa usando o ID da multa; a lista de recursos não cria outra defesa e abre o PDF existente usando o ID do recurso.
- **Testado localmente:** IDs distintos de multa e recurso cobertos no contrato do serviço.
- **Pendente de integração:** geração e abertura do PDF com dados reais e plano elegível.

### VM-03.04 — Cancelamento de assinatura

- **Implementado:** o frontend não força `plano: gratis` após cancelar; mantém o estado informado pelo servidor.
- **Implementado:** a ação fica indisponível após a solicitação bem-sucedida para evitar múltiplos envios na mesma sessão.
- **Limitação confirmada:** o backend retorna somente `ok` e `mensagem`, apesar de alterar o plano diretamente; não informa estado de solicitação, vigência ou plano efetivo.
- **Pendente de backend/homologação:** definir contrato de estado de assinatura e validar cancelamento ao fim da vigência.

### VM-03.05 — Restauração da sessão

- **Revisado:** a restauração local continua sendo usada apenas para iniciar as chamadas autenticadas; a tela só segue para home depois de carregar veículos e multas.
- **Limitação confirmada:** não existe endpoint de identidade autenticada (`GET /v1/eu` ou equivalente); `/v1/eu/dados` é exportação e não deve ser usado para esse fim.
- **Proposta registrada:** criar posteriormente endpoint de identidade mínima, autenticado por JWT, retornando `id`, `nome`, `email` e plano vigente, sem dados sensíveis desnecessários.
- **Pendente:** alteração contratual do backend e homologação real; nenhuma validação fictícia foi adicionada.

### Evidências e riscos remanescentes

- `npm run typecheck`: passou.
- `npm test`: 2 arquivos, 17 testes passaram.
- `npm run build`: passou; bundle Vite gerado sem erros.
- Backend real, banco SQLite, Docker, Capacitor e testes nativos não foram executados.
- A Etapa 03 permanece aberta até a homologação HTTP na VPS e a definição do contrato de assinatura/identidade.
- Commit da implementação: `beaa5e53e63b8f6351ddaed2f94a819c819b7ead`.
- Push confirmado em `meu-github/migration-react-typescript-capacitor`.
