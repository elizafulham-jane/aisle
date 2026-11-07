#!/usr/bin/env bash
# Run migrations + pgTAP database tests.
#
#   * If the Supabase CLI and Docker are available, uses the real local Supabase stack:
#       supabase db reset && supabase test db
#   * Otherwise (or with DB_TEST_MODE=plain) spins up a throwaway Postgres cluster,
#     loads a small Supabase shim (auth schema, API roles), applies every migration in
#     order and runs the same tests with pg_prove. Requires Postgres 16+, PostGIS and pgTAP.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${DB_TEST_MODE:-auto}"

if [[ "$MODE" == "auto" ]]; then
  if command -v supabase >/dev/null 2>&1 && docker info >/dev/null 2>&1 && supabase status >/dev/null 2>&1; then
    MODE="supabase"
  else
    MODE="plain"
  fi
fi

if [[ "$MODE" == "supabase" ]]; then
  cd "$ROOT"
  supabase db reset
  exec supabase test db
fi

PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PORT="${DB_TEST_PORT:-54329}"
DATA="$ROOT/.db-test/data"
LOG="$ROOT/.db-test/postgres.log"

# initdb refuses to run as root; use the postgres OS user when needed.
RUN=()
if [[ "$(id -u)" == "0" ]]; then
  RUN=(sudo -u postgres)
fi

cleanup() {
  "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
rm -rf "$ROOT/.db-test"
mkdir -p "$ROOT/.db-test"
[[ ${#RUN[@]} -gt 0 ]] && chown -R postgres "$ROOT/.db-test"

"${RUN[@]}" "$PG_BIN/initdb" -D "$DATA" -U postgres --auth=trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$DATA" -o "-p $PORT -k /tmp -c listen_addresses=''" -l "$LOG" -w start >/dev/null

export PGHOST=/tmp PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -f "$ROOT/supabase/local/supabase_shim.psql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate $(basename "$f")"
  "${PSQL[@]}" -f "$f" >/dev/null
done

echo "running pgTAP tests"
cd "$ROOT/supabase/tests"
pg_prove --ext .sql -r .
