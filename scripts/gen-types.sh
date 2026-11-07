#!/usr/bin/env bash
# Regenerate packages/db/src/database.types.ts from the migrations.
#   * With a running local Supabase stack: supabase gen types --local
#   * Otherwise: build a throwaway Postgres from the migrations (same as db-test.sh) and
#     point the CLI at it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/packages/db/src/database.types.ts"

if command -v supabase >/dev/null 2>&1 && supabase status >/dev/null 2>&1; then
  supabase gen types typescript --local --schema public > "$OUT"
  exit 0
fi

PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT=54331
DIR="$(mktemp -d)"
RUN=()
if [[ "$(id -u)" == "0" ]]; then
  chown postgres "$DIR"
  RUN=(sudo -u postgres)
fi
cleanup() {
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$DIR"
}
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$DIR/data" -U postgres --auth=trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k /tmp -c listen_addresses=127.0.0.1" -l "$DIR/log" -w start >/dev/null

export PGHOST=/tmp PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
psql -qX -v ON_ERROR_STOP=1 -f "$ROOT/supabase/local/supabase_shim.psql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do
  psql -qX -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done

npx -y supabase@3.0.0 gen types typescript \
  --remote "postgresql://postgres@127.0.0.1:$PORT/postgres?sslmode=disable" \
  --schema public > "$OUT" 2>/dev/null
echo "wrote $OUT"
