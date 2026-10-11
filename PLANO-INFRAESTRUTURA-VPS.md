# Plano de infraestrutura VPS — VeriMulta

Status: preparação documental da VM-05.01. Nenhuma VPS foi acessada ou alterada.

## Diagnóstico confirmado

- Backend Node.js/Express em `6_CODIGO_FONTE/sistema`, com `engines.node >=22 <25`.
- O processo serve os arquivos estáticos de `publico` e a API `/v1` no mesmo processo.
- Banco SQLite via `better-sqlite3`, com WAL, arquivo definido por `DB_PATH` e criação/migrações idempotentes em inicialização.
- Uploads usam `multer`, limite de 8 MB e diretório temporário `/tmp/uploads`; o fluxo atual tenta remover os arquivos após OCR/scan.
- SMTP, Google Vision e Mercado Pago são opcionais/configuráveis. Sem SMTP, e-mails ficam registrados em `emails_log`; sem fonte oficial ativa, consultas não devem fabricar dados.
- Há tarefas internas com `setInterval` para alertas de prazo e varredura. O rate limit é em memória e não é compartilhado entre processos.
- `GET /v1/saude` é o health check existente. Logs são stdout/stderr do processo.
- O repositório também contém `render.yaml`; ele descreve o ambiente atual de referência, não uma VPS já provisionada.

## Arquitetura proposta, sem execução nesta etapa

1. DNS aponta para um proxy reverso (Nginx ou Caddy) em uma VPS dedicada ao ambiente escolhido.
2. O proxy termina TLS, redireciona HTTP para HTTPS, limita tamanho de request e encaminha `/v1` e os documentos estáticos para um único serviço Node inicialmente.
3. A aplicação roda com usuário sem privilégios, `NODE_ENV=staging` ou `production`, `DB_PATH` em volume persistente e secrets injetados pelo mecanismo do provedor, nunca no Git.
4. Staging e produção devem ter diretórios, banco, secrets, webhook, SMTP e domínio separados. Staging deve usar gateway demo/teste e não receber eventos de produção.
5. Backups precisam ser criptografados, testados por restauração e mantidos fora da mesma VPS. Antes de produção: janela, retenção, RPO/RTO e procedimento de rollback aprovados.
6. O serviço deve ter restart supervisionado (systemd ou equivalente), limite de memória/CPU, rotação de logs e monitoramento de `/v1/saude`.

## Segurança operacional

- Configurar proxy confiável antes de aceitar `X-Forwarded-For`; o código usa o primeiro IP desse cabeçalho para rate limit.
- Manter `ORIGENS_PERMITIDAS` explícita; não usar `*`.
- Usar secrets diferentes por ambiente, com rotação documentada. `ADMIN_SECRET` compartilhado não substitui RBAC/auditoria individual.
- Não expor SQLite, uploads, logs ou `.env` pelo servidor web. Validar permissões do diretório e espaço em disco.
- Definir timeout/retry para Google Vision, Mercado Pago e SMTP; validar payloads externos e observar falhas sem registrar tokens ou PII desnecessária.

## Compatibilidade Linux

O ponto de atenção é `better-sqlite3`, módulo nativo. A instalação deve ocorrer no próprio Linux compatível com Node 22, com toolchain disponível no provisionamento ou usando artefato comprovadamente compatível. Não instalar nem compilar isso nesta VM. `pdfkit`, `bcryptjs`, `multer`, `nodemailer`, `jsonwebtoken` e `qrcode` não alteram a estratégia de banco, mas devem ser instalados a partir do lockfile quando existir.

## Recursos: medição versus hipótese

O repositório não contém benchmark, volume de usuários, tamanho de uploads, concorrência ou perfil de memória; portanto não há capacidade mínima comprovada. Como hipótese inicial para dimensionar o primeiro staging, e não como requisito de produção, pode-se começar medindo uma VM de 1 vCPU, 1–2 GB de RAM e 10 GB de disco persistente. A justificativa é um único processo Node, SQLite local, logs e espaço para snapshots; OCR, PDF, SMTP e consultas externas podem alterar o consumo. Medir CPU, RSS, latência, crescimento do banco, temporários e I/O durante homologação antes de escolher produção. O dimensionamento final depende de RPO/RTO, retenção e carga reais.

## Bloqueios para homologação

Domínio/TLS, provedor, sizing, supervisão, backup restaurável, credenciais de staging, SMTP de teste, webhook isolado, política de logs e evidência visual/HTTP ainda não foram definidos ou executados. A arquitetura acima é proposta, não homologação.
