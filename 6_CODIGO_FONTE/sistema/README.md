# Verimulta MVP v0.1 — Backend real (API v1)

Código funcional do MVP conforme o Handoff (doc 09): autenticação JWT, banco SQLite,
motor de auditoria A1–A14, jurimetria v1, geração de Defesa Prévia e paywall por plano.
**Testado ponta a ponta** com o caso real AIT T00226588 (30% — agente, fragilidade A12).

## Rodar localmente
```bash
npm install          # exige Node 22.x (better-sqlite3 compila fora dessa faixa)
node servidor.js     # API em http://localhost:3000
```
Em desenvolvimento os segredos são gerados aleatoriamente a cada execução e
impressos no console (os tokens não sobrevivem a um restart — é o esperado).

## Variáveis de ambiente

Com `NODE_ENV=production` estas três são **obrigatórias** — sem elas o processo
aborta no boot (`config.js`). Não existe segredo padrão no código.

| Variável | Obrigatória | Para quê |
|---|---|---|
| `JWT_SECRET` | sim (prod) | assinatura dos tokens de sessão |
| `ADMIN_SECRET` | sim (prod) | header `x-admin-secret` das rotas `/v1/admin/*` |
| `WEBHOOK_SECRET` | sim (prod) | HMAC do webhook de pagamento |
| `GATEWAY` | não | `demo` (padrão) ou `mercadopago` |
| `MP_ACCESS_TOKEN`, `URL_BASE` | se `GATEWAY=mercadopago` | credenciais do gateway |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_DE` | não | sem SMTP, e-mails só ficam registrados em `emails_log` |
| `GOOGLE_VISION_KEY` | não | sem chave, o OCR devolve `null` e o fluxo segue com preenchimento manual |
| `DB_PATH` | não | caminho do SQLite (padrão `./verimulta.db`) |

⚠️ `GATEWAY=demo` em produção mantém `/v1/assinaturas/ativar` liberado (o boot avisa).

## Tabela de planos
`planos.js` é a **fonte única**: `servidor.js` (limites e paywall) e
`pagamentos.js` (checkout) leem dela. Preço novo ou plano novo se altera ali —
em um lugar só. `npm test` falha se o app oferecer um plano que o checkout não aceita.

## Endpoints (v1)
| Método | Rota | Descrição |
|---|---|---|
| POST | /v1/auth/register | Cadastro (nome, cpf, email, senha ≥8) → token JWT |
| POST | /v1/auth/login | Login → token |
| GET/POST | /v1/veiculos | Lista / adiciona veículo (limite por plano) |
| POST | /v1/multas/scan | Cadastra multa (multipart, aceita `foto`) — **ponto de plug do OCR** |
| GET | /v1/multas | Lista multas do usuário |
| GET | /v1/multas/:id/diagnostico | Auditoria A1–A14 + jurimetria (grátis: probabilidade bloqueada) |
| POST | /v1/recursos | Gera Defesa Prévia (exige assinatura — HTTP 402 sem plano) |
| POST | /v1/recursos/:id/desfecho | Registra deferido/indeferido (calibração) |
| POST | /v1/jurimetria/avaliar | Avaliação avulsa de um conjunto de fatos |
| GET | /v1/planos | Grade de planos |
| POST | /v1/assinaturas/ativar | Ativa plano — **em produção, só via webhook do gateway** |
| POST | /v1/assinaturas/cancelar | Cancela em 1 toque |

## Fluxo freemium implementado
Cadastro grátis → cadastra multa → diagnóstico mostra OS VÍCIOS mas **probabilidade = null + paywall**
→ tentar defesa = **402** → ativar plano → probabilidade liberada + defesa gerada.

## 🚀 DEPLOY NO RENDER (grátis) — passo a passo
1. Crie uma conta em **render.com** (pode entrar com GitHub).
2. Suba esta pasta para um repositório no GitHub (privado): github.com/new →
   arraste os arquivos (sem node_modules) ou use `git push`.
3. No Render: **New → Web Service** → conecte o repositório.
4. Configure: Runtime **Node** · Build `npm install` · Start `node servidor.js` ·
   Instance **Free**.
5. Em Environment, adicione `JWT_SECRET` = uma frase longa e aleatória.
6. Deploy. O Render devolve a URL: `https://verimulta.onrender.com` —
   **site + app + API juntos** (o servidor já serve a pasta publico/).
7. Domínio próprio: Settings → Custom Domains → `app.verimulta.com.br`
   (crie o CNAME no DNS do Netlify apontando para a URL do Render).

⚠️ Plano Free do Render hiberna após 15 min sem uso (1º acesso demora ~30s).
Para o lançamento, suba para o plano Starter (US$ 7/mês) — sem hibernação.
💾 SQLite no Free não persiste entre deploys: para dados definitivos, crie um
Postgres no Render (Free) e migre — ou use Starter + Disk persistente.

### Se mantiver o site no Netlify e só a API no Render
No `app.html` do Netlify, preencha na 1ª linha do script:
`window.VERIMULTA_API_URL = 'https://SEU-APP.onrender.com';`
(o CORS já está liberado no servidor).

## Outras opções de deploy
1. **Render.com** (grátis para começar): novo Web Service → conectar repo → build `npm install`,
   start `node servidor.js` → env `JWT_SECRET`. Trocar SQLite por Postgres (Render fornece) quando escalar.
2. **Railway.app** (~US$5/mês) — mesmo processo.
3. **VPS próprio** (Locaweb Cloud/Hostinger): Node 18+, `pm2 start servidor.js`, Nginx como proxy + HTTPS.

Aponte `api.verimulta.com.br` (CNAME no DNS do Netlify) para o serviço.

## 💳 PAGAMENTOS — ligar o Mercado Pago (produção)
O ciclo do dinheiro já está pronto e testado: checkout → webhook assinado → ativação → cancelamento → trilha em `pagamentos`.

1. Crie a conta em **mercadopago.com.br** (PJ quando tiver o CNPJ) e acesse
   **mercadopago.com/developers** → Suas integrações → Criar aplicação.
2. Copie o **Access Token de produção** (APP_USR-...).
3. No painel da aplicação → **Webhooks** → URL: `https://SEU-APP.onrender.com/v1/webhooks/pagamento`
   → eventos: *Planos e assinaturas* + *Pagamentos* → copie a **assinatura secreta**.
4. No Render → Environment, defina:
   `GATEWAY=mercadopago` · `MP_ACCESS_TOKEN=...` · `WEBHOOK_SECRET=...` · `URL_BASE=https://SEU-APP.onrender.com`
5. Pronto: o botão "Assinar" do app abre o checkout do MP; o webhook valida a
   assinatura criptográfica, consulta o status REAL no gateway e só então ativa.
   Cancelamento no MP → webhook rebaixa para o plano grátis automaticamente.

Segurança embutida: HMAC verificado com timingSafeEqual · estado sempre
reconsultado na API do MP (nunca confia no payload) · ativação direta retorna
403 fora do modo demo · toda movimentação auditada na tabela `pagamentos`.

Taxas de referência do MP (2026): PIX ~0,99% · cartão recorrente ~4,98%.
Compare com Asaas/Stripe quando o volume crescer.

## Pontos de plug (marcados no código)
- **OCR real**: em `/v1/multas/scan` — enviar `req.file` ao Google Vision/AWS Textract e
  pré-preencher os campos (confirmação manual do usuário permanece, como no doc 09).
- **Consultas oficiais**: mediante credenciamento SENATRAN/SERPRO (roadmap doc 09).

## Segurança já embutida
Senhas com bcrypt (custo 10) · JWT 7 dias · limites de upload 8MB · SQL sempre parametrizado ·
paywall no servidor (não só na interface) · disclaimer jurídico em toda resposta de estimativa ·
segredos obrigatórios em produção (sem valor padrão no código) · comparação do
`ADMIN_SECRET` resistente a timing attack · webhook com HMAC + reconsulta do
estado real no gateway.

## Pendências conhecidas (auditoria de 02/09/2026)
Levantadas e ainda **não** corrigidas — ver `6_CODIGO_FONTE/AUDITORIA.md`:
IDOR em `veiculo_id`, ausência de rate limit no login, CORS `*`, uploads não
removidos de `/tmp`, XSS armazenado (auto-infligido) no `app.html`, jurimetria
somando teses correlatas até 100%, e A3 com intervalo negativo.

## Próximos incrementos (ordem sugerida)
1. Ligar o app.html à API (fetch nos formulários) — front e back conversando.
2. Webhook do gateway + tela de checkout.
3. OCR com chave do Google Vision (R$ ~0,007/imagem).
4. Postgres + backups + monitoramento (Sentry).
5. Beta fechado com 20 usuários reais → calibrar jurimetria com desfechos.
