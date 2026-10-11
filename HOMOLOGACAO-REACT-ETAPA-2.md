# Verimulta — Homologação React — Etapa 2.1

**Data:** 11/10/2026
**Branch:** `migration-react-typescript-capacitor`
**Escopo:** primeira jornada React isolada: login → cadastro → home → verificar multa → análise → confirmação → diagnóstico
**Status final:** **não aprovada para homologação integrada**; a aplicação React compila e passa seus testes de contrato, mas a validação ponta a ponta contra o Express ficou bloqueada pela dependência nativa `better-sqlite3` no ambiente.

## 1. Ambiente verificado

| Item | Resultado |
|---|---|
| Branch | `migration-react-typescript-capacitor` confirmada |
| Node global | `v20.20.0` |
| Node isolado preparado | `v22.14.0`, via pacote temporário `node@22.14.0` |
| npm | `10.8.2` |
| Frontend React | Dependências instaladas; build executável |
| Backend | Instalação completa não concluída |
| Banco usado | Nenhum banco existente foi aberto ou alterado |
| Deploy/commit/push | Não realizados |
| Legado | Nenhum arquivo em `6_CODIGO_FONTE` foi alterado |

### Bloqueio confirmado

`better-sqlite3@13.0.3` exige Node 22 ou superior. Com Node 22.14.0, o pacote tentou compilação via `node-gyp`; o ambiente não possui Visual Studio com workload C++:

```text
gyp ERR! find VS could not use PowerShell to find Visual Studio 2017 or newer
You need to install the latest version of Visual Studio
including the Desktop development with C++ workload.
```

O fallback com Node 20 também não é válido: o pacote declara `engines.node >=22` e novamente tentou compilação nativa. Não foi alterada a dependência para mascarar o problema e nenhum toolchain pesado foi instalado.

## 2. Testes executados

### Frontend React

Executados com sucesso:

```text
npm run typecheck  → passou
npm test           → 2 arquivos, 11 testes, 11 passaram
npm run build      → passou; Vite gerou dist/index.html e bundle
npm audit          → 0 vulnerabilidades após organização das dependências
```

Os testes cobrem:

- Header `Authorization` com JWT.
- Serialização JSON.
- Limpeza da sessão em HTTP 401.
- Propagação explícita de 401, 402, 403, 409, 413, 429 e 500.
- Timeout/erro de conexão via cliente centralizado.
- Leitura multipart em `/v1/multas/ler`.
- Garantia de que a leitura não chama a rota de persistência.
- Confirmação separada em `/v1/multas/scan`.
- Propagação do ID do veículo.
- Consulta de diagnóstico por ID.

### Backend

O teste unitário foi executado no diretório correto com Node 22.14.0:

```text
npx --yes node@22.14.0 teste.js → === 0 falha(s) ===
```

Ele aprovou as regras de auditoria, OCR sintético, planos, segredos, datas, fontes externas e a garantia de que a multa só é criada depois da confirmação.

O teste de API não pôde iniciar porque a instalação incompleta não disponibilizou `express`, consequência da falha anterior do `better-sqlite3`. Portanto, não há resultado válido de integração HTTP neste ambiente.

## 3. Funcionalidades avaliadas

| Requisito | Estado | Evidência |
|---|---|---|
| Cadastro com aceite LGPD | Parcial | Tela e payload implementados; API real não executada |
| Rejeição de cadastro inválido | Parcial | Validação e contrato tipados; API real não executada |
| Login válido | Parcial | Tela, cliente e contrato implementados; API real não executada |
| Login inválido | Parcial | `ApiError(401)` coberto no cliente; API real não executada |
| Persistência/restauração de sessão | Parcial | `CredentialStorage` implementado; reload visual não validado contra API |
| Cadastro/listagem de veículos | Parcial | Serviços implementados; API real não executada |
| Upload da notificação | Aprovado no contrato | Teste multipart e tela executada |
| OCR real | Pendente externo | `GOOGLE_VISION_KEY` não configurada; backend não iniciou |
| Preenchimento manual | Aprovado no código | Fluxo `scan → confirm` implementado |
| Correção de campos OCR | Aprovado no código | Campos editáveis em `ConfirmPage` |
| Confirmação e persistência da multa | Parcial | Separação `/ler` vs `/scan` testada; persistência real não executada |
| Diagnóstico A1–A14 | Parcial | Contrato e renderização implementados; resposta real não executada |
| Restrições do plano grátis | Parcial | Paywall usa `diagnostico.paywall`; backend real não executado |
| Sessão expirada | Aprovado no cliente | HTTP 401 limpa credencial; jornada real pendente |
| Erros HTTP/indisponibilidade | Aprovado no cliente | Códigos principais cobertos em 8 testes |

Nenhum resultado oficial de multa foi inventado ou utilizado na homologação React.

## 4. Comparação visual

### Evidência disponível

O React foi servido localmente pelo Vite e a tela de cadastro foi inspecionada no navegador. A captura confirmou:

- Cabeçalho azul com gradiente.
- Tipografia e hierarquia compatíveis com `app.html`.
- Campos arredondados, bordas, espaçamentos e botão amarelo/azul.
- Layout mobile com largura máxima de 430px.
- Safe area incluída no CSS da navegação.

Validação de largura via DOM:

| Viewport | `body.scrollWidth` | Overflow horizontal |
|---:|---:|---|
| 320px | 320px | Não |
| 360px | 360px | Não |
| 390px | 390px | Não |
| 430px | 430px | Não |

### Limitação

Não foi possível abrir o arquivo `file://` do HTML legado no navegador de homologação por política de segurança da ferramenta. Portanto, não foi produzido diff pixel-a-pixel nem captura lado a lado no mesmo navegador.

A comparação feita por fonte confirma que os tokens principais do app foram preservados: Sora/Inter/IBM Plex Mono, `#071E42`, `#0B3C7E`, `#0E4C9E`, `#FFC933`, `#FFB300`, `#0E8A5F`, `#D6453A`, raios, sombras, safe areas e largura de 430px. Isso é evidência de intenção/estrutura, não prova de equivalência visual completa.

Não foram corrigidas divergências visuais, porque nenhuma divergência causada pela migração foi comprovada.

## 5. Auditoria do código React

Foram examinados 23 arquivos de fonte em `frontend-react/src` e os arquivos de configuração.

### Resultado

- Não há uso de `any` no código de produção.
- Não há `innerHTML`, `dangerouslySetInnerHTML` ou `eval`.
- O único acesso direto ao DOM é o mount inicial do React.
- `localStorage` está encapsulado em `CredentialStorage`, permitindo substituição por armazenamento seguro no Capacitor.
- `ADMIN_SECRET` não aparece no frontend.
- O JWT é enviado somente pelo cliente HTTP centralizado.
- HTTP 401 limpa a sessão.
- O cliente trata respostas JSON e binárias, embora a primeira jornada ainda não use PDF.
- `Promise.all` é usado somente para carregar veículos e multas independentes.
- Estado visual, sessão, dados do servidor e campos da multa estão separados; não foi identificada duplicação crítica.
- `App.tsx` é o maior componente, com 63 linhas físicas, mas ainda coordena somente a jornada desta etapa.
- Os serviços não recalculam auditoria, plano ou autorização; essas responsabilidades permanecem no backend.
- Campos OCR são renderizados como texto React, sem interpolação HTML insegura.

### Pontos de atenção sem correção automática

1. A sessão web ainda usa `localStorage`; isso é uma implementação provisória e não deve ser tratada como armazenamento seguro nativo.
2. A restauração de sessão depende do usuário persistido localmente; a confirmação definitiva deve vir de um endpoint de sessão/perfil quando o backend oferecer esse contrato.
3. O campo é rotulado “E-mail ou CPF”, mas o backend atual autentica por e-mail. A UI não deve prometer login por CPF sem alteração de contrato.
4. Não há teste de componente React em ambiente DOM; os testes atuais são de cliente/contrato.
5. O build gera artefatos ignorados (`dist/`, `node_modules/`), sem alteração do legado.

Nenhum desses pontos foi transformado em refatoração fora do escopo.

## 6. Critérios de aceite

| Critério | Estado |
|---|---|
| React isolado sem substituir HTML legado | Atendido |
| TypeScript estrito | Atendido; typecheck verde |
| Cliente HTTP tipado | Atendido |
| Upload separado da persistência | Atendido no contrato/teste |
| Paywall baseado na API | Atendido no componente; API real pendente |
| Tratamento de sessão expirada | Atendido no cliente |
| Backend real integrado | Não atendido; bloqueado por SQLite nativo |
| Testes backend existentes | Unitário atendido; API não executado |
| Teste OCR real | Não atendido; chave ausente e backend bloqueado |
| Comparação pixel-a-pixel com legado | Não atendido; acesso `file://` bloqueado |
| Testes 320/360/390/430 | Parcialmente atendido; sem overflow DOM confirmado |
| Teste desktop | Não atendido como captura comparativa formal |
| Banco de produção preservado | Atendido; nenhum banco encontrado/alterado |
| Capacitor iniciado | Não iniciado, conforme restrição |
| Deploy/commit/push | Não realizados |

## 7. Correções realizadas durante a homologação

Nenhuma correção de produto foi necessária durante a homologação. Foram apenas corrigidos previamente problemas de compilação e de persistência do registro de sessão na implementação inicial.

Não foram modificados backend, banco, HTML legado, `site-netlify` ou sincronização.

## 8. Pendências externas

- Disponibilizar Node 22/24 com toolchain C++ compatível, ou um ambiente que forneça binário compatível de `better-sqlite3@13.0.3`.
- Instalar dependências do backend com sucesso.
- Executar `npm test` completo e `teste_api.js` com `DB_PATH` apontando para arquivo descartável.
- Subir Express e Vite simultaneamente com `VITE_API_URL` local.
- Executar todos os fluxos ponta a ponta, incluindo 401/402/429 e paywall real.
- Configurar `GOOGLE_VISION_KEY` somente em ambiente de teste seguro para validar OCR real; caso contrário, homologar explicitamente o caminho manual.
- Capturar HTML legado e React nos mesmos viewports por uma ferramenta de comparação visual permitida.
- Validar desktop e estados de erro visualmente.

## 9. Veredito e recomendação

**Veredito:** a primeira jornada React está funcional no nível de compilação, renderização e contratos isolados, mas **não está pronta para homologação integrada nem para substituir o HTML legado**.

**Próxima ação recomendada:** preparar um ambiente de homologação com Node 22/24 e compilador nativo disponível para `better-sqlite3`, usando um `DB_PATH` temporário fora de produção. Só depois repetir os testes HTTP reais e a comparação visual lado a lado. Não avançar para novas telas ou Capacitor antes desses critérios estarem verdes.
