#!/usr/bin/env bash
set -Eeuo pipefail

# Preparação deliberadamente conservadora. Requer confirmação explícita e
# recusa criar/alterar caminhos já existentes.
[[ "${EUID}" -eq 0 ]] || { echo 'Execute como root somente no host de staging autorizado.' >&2; exit 1; }
[[ "${CONFIRM_STAGING_INSTALL:-}" == 'YES' ]] || { echo 'Defina CONFIRM_STAGING_INSTALL=YES após revisar o script.' >&2; exit 1; }

SERVICE_USER="${SERVICE_USER:-verimulta-staging}"
APP_ROOT="${APP_ROOT:-/opt/verimulta-staging}"
DATA_ROOT="${DATA_ROOT:-/var/lib/verimulta-staging}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/verimulta-staging}"
LOG_ROOT="${LOG_ROOT:-/var/log/verimulta-staging}"
ENV_DIR="${ENV_DIR:-/etc/verimulta-staging}"

for path in "$APP_ROOT" "$DATA_ROOT" "$BACKUP_ROOT" "$LOG_ROOT" "$ENV_DIR"; do
  [[ ! -e "$path" ]] || { echo "Recusando sobrescrever caminho existente: $path" >&2; exit 1; }
done
id "$SERVICE_USER" >/dev/null 2>&1 && { echo "Usuário já existe: $SERVICE_USER" >&2; exit 1; }

command -v node >/dev/null 2>&1 || { echo 'Node 22.x deve ser instalado previamente.' >&2; exit 1; }
node -e "const m=+process.versions.node.split('.')[0]; if(m!==22) process.exit(1)" || { echo 'Node 22.x é obrigatório para este modelo.' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'npm ausente.' >&2; exit 1; }

useradd --system --home-dir "$APP_ROOT" --shell /usr/sbin/nologin "$SERVICE_USER"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$APP_ROOT" "$DATA_ROOT" "$DATA_ROOT/uploads" "$LOG_ROOT"
install -d -o root -g "$SERVICE_USER" -m 0750 "$BACKUP_ROOT"
install -d -o root -g root -m 0750 "$ENV_DIR"
echo "Estrutura criada. Copie o código, crie o env com chmod 600 e instale os exemplos após revisão."
