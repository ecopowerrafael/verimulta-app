#!/usr/bin/env bash
set -Eeuo pipefail

: "${BACKUP_PATH:?Defina BACKUP_PATH para um backup de staging}"
: "${RESTORE_DIR:=/var/lib/verimulta-staging/restore-check}"

[[ -f "$BACKUP_PATH" ]] || { echo "Backup não encontrado: $BACKUP_PATH" >&2; exit 1; }
[[ "$BACKUP_PATH" != *production* && "$BACKUP_PATH" != *prod* ]] || { echo 'Recusando backup com aparência de produção.' >&2; exit 1; }
[[ ! -e "$RESTORE_DIR" ]] || { echo "Destino já existe; escolha uma cópia descartável nova: $RESTORE_DIR" >&2; exit 1; }
command -v sqlite3 >/dev/null 2>&1 || { echo 'sqlite3 ausente.' >&2; exit 1; }

install -d -m 0750 "$RESTORE_DIR"
sqlite3 "$BACKUP_PATH" ".backup '$RESTORE_DIR/verimulta.db'"
sqlite3 "$RESTORE_DIR/verimulta.db" 'PRAGMA integrity_check; PRAGMA foreign_keys;'
chmod 0640 "$RESTORE_DIR/verimulta.db"
printf 'Restauração descartável criada em: %s\n' "$RESTORE_DIR/verimulta.db"
