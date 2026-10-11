# Preparação de staging Linux — VeriMulta

Estes arquivos são modelos revisáveis para uma VPS de staging. Eles não foram executados nem apontam para um servidor real.

## Pré-condições explícitas

- Ubuntu compatível, acesso administrativo autorizado e host dedicado ao VeriMulta.
- Node.js 22.x, npm, Nginx e systemd disponíveis; instalar dependências a partir do `6_CODIGO_FONTE/sistema/package-lock.json`.
- Domínio de staging definido, certificado TLS emitido e DNS apontado para o host correto.
- Nenhum segredo de produção, banco de produção, webhook de produção ou SMTP de produção pode ser reutilizado.

## Organização proposta

```text
/opt/verimulta-staging/                 código e build React
/opt/verimulta-staging/frontend-react/dist/
/var/lib/verimulta-staging/verimulta.db banco e WAL
/var/lib/verimulta-staging/uploads/     temporários não públicos
/var/backups/verimulta-staging/         cópias externas ao web root
/var/log/verimulta-staging/             opcional; serviço usa journald
/etc/verimulta-staging/verimulta.env    secrets, modo 600
```

O usuário `verimulta-staging` deve ser o dono do processo e dos diretórios privados. O Nginx só deve ler o `dist` público e encaminhar `/v1`; nunca servir `/var/lib`, backups ou `.env`.

## Ordem segura

1. Revisar os placeholders e autorizar o host explicitamente.
2. Executar `verify-staging.sh` em modo leitura.
3. Executar `install-staging.sh` somente com `CONFIRM_STAGING_INSTALL=YES`, após revisar o script.
4. Criar o ambiente `.env` por canal seguro, instalar dependências com `npm ci` e gerar o `dist` em staging.
5. Instalar o unit file, validar com `systemd-analyze verify`, iniciar uma única instância e consultar `journalctl`.
6. Instalar Nginx/TLS conforme a política do host e executar o checklist.
7. Criar um banco novo, realizar backup/restauração descartável e só então iniciar os testes HTTP.

Os scripts recusam caminhos já existentes quando a operação poderia sobrescrever conteúdo. Nenhum deles executa deploy, checkout, webhook, OCR pago, envio de e-mail ou migração de schema.
