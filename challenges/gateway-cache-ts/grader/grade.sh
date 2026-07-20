#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -d "$GRADER_DIR/hidden" ]; then HIDDEN_DIR="$GRADER_DIR/hidden"; else HIDDEN_DIR="/grader/hidden"; fi
if [ -x "/c/nvm4w/nodejs/node.exe" ]; then NODE_BIN="/c/nvm4w/nodejs/node.exe"; elif [ -x "/c/Program Files/nodejs/node.exe" ]; then NODE_BIN="/c/Program Files/nodejs/node.exe"; else NODE_BIN=node; fi
if "$NODE_BIN" --experimental-strip-types -e "" >/dev/null 2>&1; then NODE_ARGS="--experimental-strip-types"; TEST_FILE="tests/cache.test.ts"; BENCH_FILE="benchmarks/bench.ts"; else NODE_ARGS=""; TEST_FILE="tests/cache.test.mjs"; BENCH_FILE="benchmarks/bench.mjs"; fi
if "$NODE_BIN" $NODE_ARGS "$TEST_FILE" >/tmp/visible.out 2>&1; then visible_passed=3; visible_failed=0; else visible_passed=0; visible_failed=1; fi
bench="$("$NODE_BIN" $NODE_ARGS "$BENCH_FILE")"
candidate_ms="$(printf '%s' "$bench" | sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p')"
candidate_size="$(printf '%s' "$bench" | sed -n 's/.*candidate_size=\([0-9]*\).*/\1/p')"
target_ms=200
baseline_ms=10000
if [ -n "$NODE_ARGS" ]; then CACHE_MODULE="$ROOT/src/response-cache.ts"; else CACHE_MODULE="$ROOT/src/response-cache.mjs"; fi
if CACHE_MODULE="$CACHE_MODULE" "$NODE_BIN" $NODE_ARGS "$HIDDEN_DIR/cache.invariant.mjs" >/tmp/hidden.out 2>&1 && [ "$candidate_size" -le 5000 ] && [ "$candidate_ms" -lt "$target_ms" ]; then hidden_passed=4; hidden_failed=0; sla_met=true; else hidden_passed=0; hidden_failed=4; sla_met=false; fi
if [ "$sla_met" = true ]; then sla_met_json=True; else sla_met_json=False; fi
diff_stat="$(git diff --numstat 2>/dev/null || true)"
files_changed="$(printf '%s\n' "$diff_stat" | awk 'NF {count++} END {print count+0}')"
insertions="$(printf '%s\n' "$diff_stat" | awk 'NF {sum+=$1} END {print sum+0}')"
deletions="$(printf '%s\n' "$diff_stat" | awk 'NF {sum+=$2} END {print sum+0}')"
if [ "$visible_failed" -eq 0 ] && [ "$hidden_failed" -eq 0 ]; then verdict=pass; else verdict=partial; fi
printf 'REPORT_JSON:%s\n' "$(python - <<PY
import json
print(json.dumps({"tests":{"visible_passed":$visible_passed,"visible_failed":$visible_failed,"hidden_passed":$hidden_passed,"hidden_failed":$hidden_failed},"bench":{"candidate_ms":float("$candidate_ms"),"baseline_ms":$baseline_ms,"target_ms":$target_ms,"improvement_pct":0,"sla_met":$sla_met_json,"cache_size":$candidate_size},"diff":{"files_changed":$files_changed,"insertions":$insertions,"deletions":$deletions},"verdict":"$verdict"}))
PY
)"
