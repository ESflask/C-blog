#!/usr/bin/env bash
# SQLite DB を初期化し、migrations を適用する。
set -euo pipefail

cd "$(dirname "$0")/.."

DB_FILE="${1:-blog.db}"

echo "Initializing $DB_FILE ..."
for f in migrations/[0-9]*.sql; do
  echo "  applying $f"
  sqlite3 "$DB_FILE" < "$f"
done

echo "Done. (seed データは手動で: sqlite3 $DB_FILE < migrations/seed.sql)"
