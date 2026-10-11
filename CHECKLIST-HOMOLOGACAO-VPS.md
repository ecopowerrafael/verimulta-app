# Checklist de homologação VPS — VeriMulta

Este checklist deve ser executado somente em ambiente de staging isolado. Itens não executados nesta VM permanecem pendentes.

## Infraestrutura

- [ ] DNS e HTTPS válidos; HTTP redireciona para HTTPS.
- [ ] Processo Node 22.x supervisionado, sem root, com restart e limites definidos.
- [ ] `/v1/saude` monitorado; logs com rotação e sem secrets/PII desnecessários.
- [ ] Volume persistente e backup criptografado restaurado em ambiente separado.
- [ ] Staging e produção separados por domínio, banco, secrets, webhook e gateway.

## API e segurança

- [ ] Cadastro/login, JWT expirado, logout no cliente e isolamento entre usuários.
- [ ] `ORIGENS_PERMITIDAS` restrita; CORS, headers e proxy confiável verificados.
- [ ] Rate limit validado em login, cadastro, uploads, feedback, consultas e fontes.
- [ ] Upload inválido, excesso de tamanho, limpeza de temporários e falha do OCR.
- [ ] Admin com segredo fornecido por canal seguro; registrar como bloqueio a ausência de identidade individual/RBAC/auditoria.
- [ ] Webhooks inválidos, duplicados, atrasados e fora de ordem sem ativação indevida.

## Dados e integrações

- [ ] SQLite restaurado e consultas por usuário/veículo comparadas.
- [ ] CNH, multas, débitos e feedback exibem apenas dados retornados pelo backend.
- [ ] Fontes oficiais continuam explicitamente indisponíveis até credenciamento real.
- [ ] SMTP de teste, Google Vision e gateway de teste têm timeout, credenciais isoladas e logs seguros.
- [ ] Tarefas de prazo/varredura executadas manualmente e em agendamento controlado; sem concorrência indevida.

## Frontend/PWA

- [ ] `index.html`, `app.html` e `admin.html` entregues nos caminhos previstos.
- [ ] Service Worker não intercepta `/v1`, admin, requests autenticadas ou respostas não-navegação com fallback HTML.
- [ ] Sessão expirada, voltar do navegador e troca de usuário não restauram dados de outra sessão.
- [ ] Viewports 320/360/390/430/768/1366 px, teclado, foco e acessibilidade revisados.

## Evidência e decisão

- [ ] Anexar logs, respostas HTTP, screenshots e SHA do artefato homologado.
- [ ] Registrar falhas e rollback antes de declarar aprovação.
- [ ] Não declarar integração oficial, cobrança real ou equivalência visual sem evidência correspondente.
