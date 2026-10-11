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
- [x] Testes unitários/contratos — 12 testes passaram; integração HTTP continua pendente.
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

**Última atualização:** 11/10/2026 — recursos/defesa, planos/checkout, cancelamento e perfil/LGPD foram migrados para React; backend integrado permanece pendente por falta de toolchain nativa no computador de desenvolvimento. Frontend validado com typecheck, 12 contratos, build e navegação local; nenhuma funcionalidade integrada foi declarada aprovada.
