# Auditoria do código-fonte — Verimulta

**Revisão 2 · 20/09/2026** · escopo `sistema/` (backend Node/Express + PWA) e `site-netlify/`
Revisão 1: 02/09/2026 (preservada no histórico do git).

Método desta revisão: além da leitura dos módulos, o sistema foi **executado**.
`npm install` e `node servidor.js` rodaram na máquina, e o funil inteiro foi
exercitado por HTTP contra um banco real — cadastro, veículo, scan, diagnóstico,
paywall, checkout, webhook, defesa, PDF, painel e exclusão de conta. Foi assim
que apareceram os três bloqueadores que a leitura de código não pega.

---

## Ambiente — correção da revisão 1

A revisão 1 registrou que `npm install` **falhou** por falta de prebuild do
`better-sqlite3` para Node 24. **Isso não se confirma:** o pacote instala e
carrega normalmente no Node 24.19. `engines` foi ajustado de `22.x` para
`>=22 <25`, que é a faixa realmente coberta pelos prebuilds.

Consequência prática: as rotas HTTP, que a revisão 1 não conseguiu exercitar,
agora têm bateria automatizada própria (`teste_api.js`).

---

## Corrigido nesta revisão

### 1. O webhook do Mercado Pago estava no endereço errado — BLOQUEADOR DE RECEITA

Todos os manuais de ativação mandam cadastrar
`https://.../v1/webhooks/mercadopago` no painel do Mercado Pago. O servidor só
respondia em `/v1/webhooks/pagamento`. O endereço do manual devolvia **404**.

Efeito: o cliente pagaria no checkout, o Mercado Pago notificaria um endereço
inexistente, e **o plano nunca seria liberado** — sem erro visível em lugar
nenhum, porque o MP apenas reenfileira a notificação em silêncio.

**Correção:** o handler passou a responder nos dois endereços. O histórico
continua funcionando e o do manual passou a existir.

### 2. Plano pago liberado de graça com o `render.yaml` de fábrica — BLOQUEADOR

`/v1/assinaturas/ativar` só checava `GATEWAY !== 'demo'` — e `GATEWAY=demo` era
justamente o valor que o `render.yaml` publicava. Verificado em produção
simulada: qualquer conta autenticada recebia `{"ok":true,"plano":"Empresa Pro"}`,
R$ 149,90/mês, sem pagar nada.

**Correção:** trava dupla. Com `NODE_ENV=production` a rota devolve 403
qualquer que seja o gateway — a única porta de ativação passa a ser o webhook.
Coberto por teste que sobe o servidor exatamente com o ambiente do `render.yaml`.

### 3. SQLite em disco efêmero — PERDA TOTAL DE DADOS A CADA DEPLOY

O `render.yaml` não declarava disco e o `DB_PATH` caía no padrão `./verimulta.db`,
dentro do sistema de arquivos efêmero do Render. **Cada deploy apagaria todos os
usuários, multas, defesas e o histórico de pagamento.**

**Correção:** disco persistente de 1 GB em `/var/data` e `DB_PATH` apontado para
ele. O plano passou de `free` para `starter`: o free hiberna, e o webhook do
Mercado Pago pode bater na porta fechada.

### 4. Grade de planos divergia entre o sistema e os manuais — BLOQUEADOR

O código vendia `individual` (29,90) e `casal` (49,90). Os manuais e o roteiro
do "teste de fogo" vendem `combo1` (29,90), `combo2` (39,90) e `combo3` (49,90).
Seguir o manual — "assine o Combo 01" — devolvia **400 Plano inválido**.

**Correção:** `planos.js` passou a valer a grade oficial dos manuais, e o app e
o site foram alinhados. As chaves antigas continuam reconhecidas por `ALIASES`
(`individual→combo1`, `casal→combo3`) para não rebaixar silenciosamente quem já
tivesse assinado. No caminho, sumiram dois cartões "Casal" duplicados — um no
app, outro no site.

### 5. Consentimento LGPD não era gravado — CONFORMIDADE

A API respondia *"consentimento_lgpd: Registrado no cadastro"*, mas não existia
coluna nenhuma: **nada era armazenado**. O item 2 da folha de homologação
("consentimento LGPD gravado") não passava, e o ônus de provar o consentimento é
do controlador (LGPD art. 8º §2º).

**Correção:** o cadastro agora **exige** aceite explícito (400 sem ele) e grava
data, IP e versão do termo. No app, o aviso passivo "ao continuar você concorda"
virou caixa de seleção — manifestação inequívoca, como o art. 8º pede.

### 6. Direitos do titular não existiam (LGPD art. 18)

**Correção:** `GET /v1/eu/dados` exporta tudo o que a plataforma guarda do
titular; `DELETE /v1/eu/conta` anonimiza a conta e apaga veículos, multas,
diagnósticos e defesas. O histórico de pagamento sobrevive, sem vínculo com
pessoa identificável, por obrigação fiscal (art. 16, I). A exclusão exige a
assinatura cancelada antes.

### 7. IDOR no `/v1/multas/scan` (achado 6 da revisão 1)

**Correção:** `veiculo_id` é conferido contra o dono antes do INSERT. Vincular a
multa ao veículo de terceiro agora devolve 404 — a placa alheia não vaza mais no
texto da Defesa Prévia.

### 8. Sem rate limit (achado 7)

**Correção:** `seguranca.js`, janela deslizante em memória, sem dependência
nova. `login` 8/5min · `register` 5/10min · `scan` 30/10min ·
`consulta-placa` 20/5min · exclusão de conta 3/h. Resposta 429 com `Retry-After`.

### 9. `Access-Control-Allow-Origin: *` em rota autenticada (achado 8)

**Correção:** allowlist por `ORIGENS_PERMITIDAS`. Sem a variável, só mesma
origem. Somados os cabeçalhos de endurecimento (`nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy`, HSTS em produção).

### 10. Uploads acumulando em `/tmp` sem validação de tipo (achado 9)

**Correção:** `fileFilter` aceita só JPG, PNG, WEBP, HEIC e PDF; o arquivo é
apagado assim que vira texto, inclusive nos caminhos de erro. Limite de 8 MB com
resposta 413 em vez de estouro.

### 11. XSS armazenado via `innerHTML` (achado 10)

**Correção:** helper `esc()` aplicado em AIT, descrição, órgão, placa e nos
detalhes das verificações — todos campos que vêm do documento enviado pelo
usuário.

### 12. Jurimetria chegava a 100% (achado 11) — RISCO DE CDC

A fórmula `1 − ∏(1−p)` tratava as teses como independentes; um radar com seis
vícios devolvia **100% de êxito**, o que é promessa de resultado.

**Correção:** jurimetria v2. Teses do mesmo equipamento (A4–A8) e da mesma
cadeia de notificações (A3, A13, A14) viraram famílias correlacionadas: dentro
da família a mais forte conta inteira e as demais entram com decaimento de 0,30.
Teto absoluto de **85%**. O mesmo radar de seis vícios agora devolve 85% com a
nota de correlação explícita. Somado o **Índice de Consistência** como manchete
(sem inconsistência / requer atenção / possível inconsistência), conforme o
Plano 7 Dias v2 — o número passa a ser apoio, não título.

### 13. A3 aceitava notificação anterior à infração (achado 13)

Emitia *"Notificação dentro do prazo (-59 dias)"*. **Correção:** data invertida é
acusada como inconsistência, com o detalhe explicando o que conferir.

### 14. `GET /v1/recursos/:id/pdf` era documentada e não existia

O Handoff descreve a rota; o PDF era `window.print()` numa janela pop-up — que
depende de pop-up liberado e sai diferente em cada aparelho.

**Correção:** geração no servidor com `pdfkit` (JS puro, sem compilação nativa).
Duas rotas: Defesa Prévia (`/v1/recursos/:id/pdf`) e Extrato de Auditoria
(`/v1/multas/:id/extrato.pdf`), ambas timbradas no nome da PrimeCorp. O app
baixa do servidor e mantém a impressão do navegador como plano B.

### 15. `site-netlify/` era cópia manual (achado 15)

Era cópia byte a byte de `sistema/publico/`, o que fez o site publicado ficar
vendendo a grade antiga. **Correção:** `sincronizar-netlify.js` gera a pasta a
partir de `publico/`, normaliza quebras de linha e preserva os quatro arquivos
exclusivos do Netlify. `npm run netlify:conferir` falha se divergir.

### 16. `emails.js` mascarava falha de banco como deduplicação (achado 16)

**Correção:** só `SQLITE_CONSTRAINT` conta como "já enviado"; qualquer outro erro
é registrado e devolvido.

### 17. `ocr.js` com array morto e pontuação incerta (achado 14)

**Correção:** o array `gravissimas` não usado (e o comentário de dúvida em
aberto) saíram. A tabela de pontuação virou `PONTOS_CTB`, com os enquadramentos
mais frequentes na redação da Lei 14.071/2020. Código não listado devolve `null`
e o app pede confirmação — melhor que chutar um número que vai dentro de uma defesa.

### 18. MRR do painel usava tabela de preço própria

`/v1/admin/resumo` tinha os preços escritos à mão, já desatualizados.
**Correção:** passou a ler `planos.js`, a mesma fonte do checkout.

---

## Em aberto — priorizado

| # | Severidade | Achado |
|---|---|---|
| 19 | **Alta (negócio)** | `/v1/consulta-placa/:placa` devolve multa fabricada (1 multa, R$ 130,16) para qualquer placa válida, **público e sem login**. Está rotulado `modo: "demonstracao"` com aviso, mas contraria a regra da própria casa ("nunca inventar multa") e é exposição de CDC. **Mantido a pedido do titular**, com a recomendação registrada de remover ou transformar em simulador sem multa antes da mídia paga. |
| 20 | Média | Sem MFA no Painel do Dono — hoje só a `ADMIN_SECRET`. É item do Pacote A do Handoff. |
| 21 | Média | Sem backup automatizado do banco. O disco persistente resolve a perda por deploy, não a perda por corrupção ou erro humano. Item 20 da folha de homologação. |
| 22 | Média | Sem observabilidade (Sentry/logs estruturados) nem reprocesso de webhook falho. Uma notificação perdida hoje é silenciosa. |
| 23 | Baixa | Rate limit vive na memória do processo. Correto para 1 instância (o plano atual); ao escalar horizontalmente, trocar o Mapa por Redis. |
| 24 | Baixa | `monitor.js` segue como arquitetura de fontes plugáveis aguardando credenciamento — correto e deliberado, mas significa que o "monitoramento 24h" anunciado no site ainda não varre fonte oficial nenhuma. |

---

## Verificado como correto

- **SQL 100% parametrizado** — nenhuma concatenação de string em query.
- Senhas com bcrypt custo 10; JWT de 7 dias; `timingSafeEqual` na chave do admin.
- **Webhook do Mercado Pago bem construído**: HMAC validado e estado real
  reconsultado na API do gateway, sem confiar no payload recebido.
- Paywall aplicado no servidor, não apenas na interface (402 verificado por teste).
- `monitor.js` com regra explícita de nunca inventar multa; fonte de demonstração
  travada atrás de `DEMO_NOVA_MULTA=true`.
- Motor A1–A14 reproduz o caso do README (AIT T00226588, agente sem foto):
  **30%, tese A12 única**. A4–A8 corretamente não aplicáveis para autuação por agente.
- Extrator de OCR recupera AIT, placa, valor, data e enquadramento em notificação
  no padrão SNE.
- **Nenhum segredo hardcoded, nenhum `.env`, nenhum arquivo `.db`** no pacote.

## Como reproduzir

```bash
cd 6_CODIGO_FONTE/sistema
npm install
npm test           # 56 asserções, 0 falhas (27 unitárias + 29 de integração HTTP)
```

`teste.js` cobre motor, extrator, grade de planos e segredos.
`teste_api.js` sobe o servidor num banco descartável e exercita as rotas,
incluindo as regressões dos itens 1, 2, 4, 5, 6, 7, 8 e 14 desta revisão.
