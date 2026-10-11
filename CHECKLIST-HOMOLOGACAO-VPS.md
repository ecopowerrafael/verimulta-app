# Checklist de homologação VPS — VeriMulta

Este checklist deve ser executado somente em ambiente de staging isolado. Itens não executados nesta VM permanecem pendentes.

**Estado VM-05.02:** artefatos locais preparados; nenhuma VPS identificada, autorizada ou provisionada.

## Infraestrutura

- [ ] DNS e HTTPS válidos; HTTP redireciona para HTTPS.
- [ ] Processo Node 22.x supervisionado, sem root, com restart e limites definidos.
- [ ] `/v1/saude` monitorado; logs com rotação e sem secrets/PII desnecessários.
- [ ] Volume persistente e backup criptografado restaurado em ambiente separado.
- [ ] Staging e produção separados por domínio, banco, secrets, webhook e gateway.
- [ ] `NODE_ENV=staging` revisado: ativação demo permanece possível e não pode receber dados, webhooks ou credenciais de produção.
- [ ] Usuário limitado, caminhos `/opt`, `/var/lib`, backups e arquivo de ambiente criados com permissões revisadas.

## API e segurança

- [ ] Cadastro/login, JWT expirado, logout no cliente e isolamento entre usuários.
- [ ] `ORIGENS_PERMITIDAS` restrita; CORS, headers e proxy confiável verificados.
- [ ] Rate limit validado em login, cadastro, uploads, feedback, consultas e fontes.
- [ ] Upload inválido, excesso de tamanho, limpeza de temporários e falha do OCR.
- [ ] Admin com segredo fornecido por canal seguro; registrar como bloqueio a ausência de identidade individual/RBAC/auditoria.
- [ ] Webhooks inválidos, duplicados, atrasados e fora de ordem sem ativação indevida.
- [ ] Confirmar `PRAGMA foreign_keys`, transações dos fluxos críticos e idempotência de eventos externos antes de qualquer uso produtivo.

## Dados e integrações

- [ ] SQLite restaurado e consultas por usuário/veículo comparadas.
- [ ] CNH, multas, débitos e feedback exibem apenas dados retornados pelo backend.
- [ ] Fontes oficiais continuam explicitamente indisponíveis até credenciamento real.
- [ ] SMTP de teste, Google Vision e gateway de teste têm timeout, credenciais isoladas e logs seguros.
- [ ] Tarefas de prazo/varredura executadas manualmente e em agendamento controlado; sem concorrência indevida.
- [ ] SMTP de staging sem envio externo, fontes oficiais desativadas e `DEMO_NOVA_MULTA=false`.

## Frontend/PWA

- [ ] `index.html`, `app.html` e `admin.html` entregues nos caminhos previstos.
- [ ] Service Worker não intercepta `/v1`, admin, requests autenticadas ou respostas não-navegação com fallback HTML.
- [ ] Sessão expirada, voltar do navegador e troca de usuário não restauram dados de outra sessão.
- [ ] Viewports 320/360/390/430/768/1366 px, teclado, foco e acessibilidade revisados.

## Evidência e decisão

- [ ] Anexar logs, respostas HTTP, screenshots e SHA do artefato homologado.
- [ ] Registrar falhas e rollback antes de declarar aprovação.
- [ ] Não declarar integração oficial, cobrança real ou equivalência visual sem evidência correspondente.

## Artefatos para provisionamento posterior

- [ ] Revisar `infra/vps/systemd/verimulta-staging.service.example` e validar com `systemd-analyze verify` no Linux.
- [ ] Substituir placeholders e validar `infra/vps/nginx/verimulta-staging.conf.example` com `nginx -t` no host autorizado.
- [ ] Executar `infra/vps/scripts/verify-staging.sh` em modo leitura.
- [ ] Executar `install-staging.sh` somente com confirmação explícita e caminhos ainda inexistentes.
- [ ] Testar `backup-sqlite.sh` e `restore-sqlite.sh` em banco descartável, sem dados pessoais.
