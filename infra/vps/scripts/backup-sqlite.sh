#!/usr/bin/env bash
set -Eeuo pipefail

: "${DB_PATH:?Defina DB_PATH apontando para o SQLite de staging}"
: "${BACKUP_DIR:=/var/backups/verimulta-staging}"
: "${BACKUP_LABEL:=manual}"

[[ -f "$DB_PATH" ]] || { echo "Banco não encontrado: $DB_PATH" >&2; exit 1; }
[[ "$DB_PATH" != *production* && "$DB_PATH" != *prod* ]] || { echo 'Recusando caminho com aparência de produção.' >&2; exit 1; }
install -d -m 0750 "$BACKUP_DIR"
target="$BACKUP_DIR/verimulta-${BACKUP_LABEL}-$(date -u +%Y%m%dT%H%M%SZ).db"
[[ ! -e "$target" ]] || { echo "Destino já existe: $target" >&2; exit 1; }

# O backup online do SQLite precisa respeitar WAL. sqlite3 deve estar instalado
# no host; o comando não apaga o banco nem copia dados de produção.
command -v sqlite3 >/dev/null 2>&1 || { echo 'sqlite3 ausente; instale-o no staging autorizado.' >&2; exit 1; }
sqlite3 "$DB_PATH" ".timeout 5000" ".backup '$target'"
chmod 0640 "$target"
printf 'Backup criado: %s\n' "$target"
