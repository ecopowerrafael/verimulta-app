#!/usr/bin/env bash
set -Eeuo pipefail

# Auditoria somente leitura. Não instala, inicia, reinicia ou altera serviços.
: "${STAGING_ROOT:=/opt/verimulta-staging}"
: "${STAGING_ENV_FILE:=/etc/verimulta-staging/verimulta.env}"

fail=0
check_cmd() { if command -v "$1" >/dev/null 2>&1; then printf 'OK   command %s\n' "$1"; else printf 'MISS command %s\n' "$1"; fail=1; fi; }
check_cmd node
check_cmd npm
check_cmd nginx
check_cmd systemctl

if command -v node >/dev/null 2>&1; then
  node_major="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$node_major" == "22" ]]; then printf 'OK   Node %s\n' "$(node --version)"; else printf 'WARN Node %s (backend requires >=22 <25)\n' "$(node --version)"; fail=1; fi
fi

if [[ -e "$STAGING_ENV_FILE" ]]; then
  perms="$(stat -c '%a' "$STAGING_ENV_FILE" 2>/dev/null || true)"
  [[ "$perms" == "600" ]] && printf 'OK   env permissions 600\n' || { printf 'FAIL env permissions %s, expected 600\n' "$perms"; fail=1; }
  if grep -Eq '^(JWT_SECRET|ADMIN_SECRET|WEBHOOK_SECRET|MP_ACCESS_TOKEN|SMTP_PASS)=($|<|replace)' "$STAGING_ENV_FILE"; then
    printf 'WARN env contains empty/example values; do not start staging until reviewed\n'
  fi
else
  printf 'MISS environment file %s\n' "$STAGING_ENV_FILE"; fail=1
fi

for path in "$STAGING_ROOT" /var/lib/verimulta-staging /var/backups/verimulta-staging; do
  [[ -e "$path" ]] && printf 'OK   path %s\n' "$path" || printf 'MISS path %s\n' "$path"
done

if [[ "$fail" -ne 0 ]]; then exit 1; fi
