# Auditoria do código-fonte — Verimulta

**Data:** 02/09/2026 · **Escopo:** `sistema/` (backend Node/Express + PWA) e `site-netlify/`
**Base auditada:** cópia de 29/08/2026 (`Projeto Verimulta Rv - 01 Ativação 29.08`), 25 arquivos, 345 KB.

Método: leitura integral dos 7 módulos do backend, do `app.html` e do `admin.html`;
execução da bateria `sistema/teste.js` (motor de auditoria, extrator de OCR,
consistência da tabela de planos, exigência de segredos); varredura de segredos
sobre todo o pacote.

---

## Corrigido nesta revisão

### 1. Os dois planos B2C não podiam ser vendidos — BLOQUEADOR

`app.html` chamava `assinar('individual')` e `assinar('casal')`, mas a tabela `PRECOS`
de `pagamentos.js` só conhecia `combo1/2/3`, `empresa_start` e `empresa_pro`.
O `/v1/checkout` respondia **400 "Plano inválido para checkout"** e a função retornava
antes de ativar. O botão principal do paywall — "Assinar e desbloquear", R$ 29,90 —
não funcionava. Apenas os dois planos empresariais eram vendáveis.

### 2. `combo1/2/3` gravavam um plano inexistente — BLOQUEADOR

Esses códigos existiam em `PRECOS` mas não em `PLANOS`. Se comprados via Mercado Pago,
o webhook gravaria `plano='combo1'` em `usuarios`; a partir daí `PLANOS[u.plano].veiculos`
e `PLANOS[u.plano].defesas` lançariam `TypeError` → **HTTP 500**. O cliente pagaria e o
app quebraria para ele.

**Correção de 1 e 2:** criado `planos.js` como fonte única. `servidor.js` (limites e
paywall) e `pagamentos.js` (checkout) passam a ler a mesma tabela; `PRECOS` e `NOMES`
são derivados dela. Os combos foram removidos e `individual` (29,90) e `casal` (49,90)
tornaram-se vendáveis, com os preços originais preservados. Adicionado `planoDe()`, que
faz um plano desconhecido no banco cair no grátis em vez de derrubar a rota.
`teste.js` falha se o app voltar a oferecer um plano que o checkout não aceita.

### 3–5. Três segredos com valor padrão previsível — ALTO

| Arquivo | Variável | Valor padrão que existia |
|---|---|---|
| `servidor.js:13` | `JWT_SECRET` | `'trocar-em-producao'` |
| `servidor.js:237` | `ADMIN_SECRET` | `'defina-admin-secret'` |
| `pagamentos.js:26` | `WEBHOOK_SECRET` | `'demo-webhook-secret'` |

Como o repositório é público, esses valores passaram a ser de conhecimento geral.
Qualquer deploy fora do blueprint do Render (VPS, Railway, execução local exposta)
subiria silenciosamente inseguro: forja de token de qualquer usuário; dump de nome,
e-mail, plano e histórico de pagamentos via `/v1/admin/resumo` (exposição LGPD); e,
como `GATEWAY` também cai em `demo` por padrão, ativação de plano de graça por
webhook forjado.

**Correção:** criado `config.js`. Com `NODE_ENV=production` as três variáveis são
obrigatórias e o processo **aborta no boot** listando as que faltam. Fora de produção,
gera um valor aleatório por execução e imprime no console — não existe mais nenhum
segredo padrão no código. `render.yaml` passou a definir `NODE_ENV=production`
explicitamente. A comparação do `ADMIN_SECRET` passou a usar `timingSafeEqual`.
Também há aviso no boot quando `GATEWAY=demo` roda em produção.

---

## Em aberto — priorizado

### Segurança

| # | Severidade | Achado |
|---|---|---|
| 6 | Média | `/v1/multas/scan` não valida se `veiculo_id` pertence ao usuário (`servidor.js`). IDOR: a multa pode ser vinculada ao veículo de terceiro e a placa alheia vaza no texto da Defesa Prévia, via o `LEFT JOIN` de `/v1/recursos`. |
| 7 | Média | Sem rate limit em `/v1/auth/login` — força bruta livre. Vale também para `/v1/auth/register` e `/v1/consulta-placa/:placa` (públicos). |
| 8 | Média | `Access-Control-Allow-Origin: *` em todas as rotas, inclusive autenticadas. |
| 9 | Média | Uploads nunca removidos de `/tmp/uploads` (multer sem cleanup) e sem validação de tipo — o disco enche com o uso. |
| 10 | Baixa | XSS armazenado: `ait`, `descricao` e `orgao` entram crus em `innerHTML` (`app.html`, cartão da multa e painel de diagnóstico). Hoje atinge só o próprio usuário, porque toda consulta é escopada por `usuario_id`; **vira cross-user** se `monitor.js` passar a ingerir dados de fontes externas. |

### Risco de negócio

| # | Achado |
|---|---|
| 11 | **Jurimetria chega a 100%.** A fórmula `1 − ∏(1−p)` trata as teses como independentes. Cenário testado (radar com 6 vícios) devolve `probabilidade: 100, faixa: "alta"`. A4–A8 são todas do mesmo equipamento e altamente correlacionadas. Apresentar 100% de êxito ao consumidor é exposição de CDC mesmo com o disclaimer — considerar teto e fator de correlação. |
| 12 | `/v1/consulta-placa/:placa` devolve dados fabricados (1 multa, R$ 130,16) para qualquer placa válida, público e sem login. Está rotulado `modo: "demonstracao"` com aviso, mas precisa sair ou virar consulta real antes do lançamento. |
| 13 | A3 com notificação anterior à infração emite `"Notificação dentro do prazo (-59 dias)."` — deveria acusar inconsistência de datas. |

### Qualidade

| # | Achado |
|---|---|
| 14 | `ocr.js`: array `gravissimas` declarado e nunca usado, com comentário de dúvida em aberto ("celular=média? … usar tabela real"). O mapa de pontuação cobre 6 códigos — precisa da tabela oficial do CTB. |
| 15 | `site-netlify/` é cópia byte a byte de `sistema/publico/` nos 7 arquivos comuns, mais 4 exclusivos (`.htaccess`, `robots.txt`, `LEIA-ME-INSTALACAO.html`, `social.png`). Vai divergir com o tempo — considerar gerar o Netlify a partir de `publico/` no build. |
| 16 | `emails.js`: o `catch` do INSERT trata qualquer erro como deduplicação, mascarando falha real de banco. |

---

## Verificado como correto

- **SQL 100% parametrizado** em todos os módulos — nenhuma concatenação de string em query.
- Senhas com bcrypt custo 10; JWT de 7 dias.
- **Webhook do Mercado Pago bem construído**: HMAC validado com `timingSafeEqual` e
  reconsulta do estado real na API do gateway, sem confiar no payload recebido.
- `/v1/assinaturas/ativar` bloqueado com 403 fora do modo demo.
- Paywall aplicado no servidor, não apenas na interface.
- `monitor.js` com regra explícita de nunca inventar multa; fonte de demonstração
  travada atrás de `DEMO_NOVA_MULTA=true`.
- Motor A1–A14 reproduz o caso do README (AIT T00226588, agente sem foto): **30%,
  tese A12 única**. A4–A8 corretamente marcadas como não aplicáveis para autuação por agente.
- Extrator de OCR recupera AIT, placa, valor, data da infração e enquadramento
  corretamente em notificação sintética no padrão SNE.
- **Nenhum segredo hardcoded, nenhum `.env`, nenhum arquivo `.db`** no pacote.

## Ambiente

`npm install` **falhou** na máquina de auditoria: `better-sqlite3@13.0.3` não tem
binário pré-compilado para Node 24 e cai em build via `node-gyp`, que exige toolchain
C++. `package.json` ganhou `engines: { node: "22.x" }` para fixar a faixa com prebuild.
Por isso a bateria de testes cobre os módulos sem dependência nativa; as rotas HTTP
não foram exercidas contra um banco real.

## Como reproduzir

```bash
cd 6_CODIGO_FONTE/sistema
node teste.js      # 21 asserções, 0 falhas
```
