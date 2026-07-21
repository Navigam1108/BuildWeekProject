#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [ -d "$GRADER_DIR/hidden" ]; then HIDDEN_DIR="$GRADER_DIR/hidden"; else HIDDEN_DIR="/grader/hidden"; fi
if [ -x "/c/nvm4w/nodejs/node.exe" ]; then NODE_BIN="/c/nvm4w/nodejs/node.exe"; elif [ -x "/c/Program Files/nodejs/node.exe" ]; then NODE_BIN="/c/Program Files/nodejs/node.exe"; else NODE_BIN=node; fi
if "$NODE_BIN" --experimental-strip-types -e "" >/dev/null 2>&1; then NODE_ARGS="--experimental-strip-types"; TEST_FILE="tests/cache.test.ts"; BENCH_FILE="benchmarks/bench.ts"; CACHE_MODULE="$ROOT/src/response-cache.ts"; else NODE_ARGS=""; TEST_FILE="tests/cache.test.mjs"; BENCH_FILE="benchmarks/bench.mjs"; CACHE_MODULE="$ROOT/src/response-cache.mjs"; fi
if "$NODE_BIN" $NODE_ARGS "$TEST_FILE" >/tmp/visible.out 2>&1; then visible_passed=6; visible_failed=0; else visible_passed=0; visible_failed=1; fi
if CACHE_MODULE="$CACHE_MODULE" "$NODE_BIN" $NODE_ARGS "$HIDDEN_DIR/cache.invariant.mjs" >/tmp/hidden.out 2>&1; then hidden_passed=3; hidden_failed=0; else hidden_passed=0; hidden_failed=3; fi
bench="$("$NODE_BIN" $NODE_ARGS "$BENCH_FILE")"
metric() { printf '%s' "$bench" | sed -n "s/.*$1=\\([0-9.]*\\).*/\\1/p"; }
bounded_ms="$(metric bounded_ms)"; bounded_size="$(metric bounded_size)"; expiry_ms="$(metric expiry_ms)"; headers_ms="$(metric headers_ms)"; coalescing_ms="$(metric coalescing_ms)"; upstream_calls="$(metric upstream_calls)"; invalidation_ms="$(metric invalidation_ms)"
python - "$visible_failed" "$hidden_failed" "$bounded_ms" "$bounded_size" "$expiry_ms" "$headers_ms" "$coalescing_ms" "$upstream_calls" "$invalidation_ms" <<'PY'
import json
import sys

visible_failed, hidden_failed = map(int, sys.argv[1:3])
bounded, size, expiry, headers, coalescing, calls, invalidation = map(float, sys.argv[3:])
definitions = [
    ("bounded-cache", "Bounded response cache", 80.0, 3.0, bounded, size <= 5000),
    ("expiry", "Expiry cleanup", 8.0, 1.5, expiry, True),
    ("headers", "Header normalization", 120.0, 4.0, headers, True),
    ("coalescing", "Request coalescing", 30.0, 1.0, coalescing, calls <= 1),
    ("invalidation", "Tag invalidation", 5.0, 0.5, invalidation, True),
]
targets = [45.0, 4.0, 20.0, 10.0, 2.0]
correct = visible_failed == 0 and hidden_failed == 0
missions = []
for (mission_id, name, baseline, golden, candidate, invariant), target in zip(definitions, targets):
    missions.append({"id": mission_id, "name": name, "baseline_ms": baseline, "candidate_ms": candidate, "golden_ms": golden, "target_ms": target, "passed": correct and invariant and candidate <= target})
passed = sum(mission["passed"] for mission in missions)
improvement = round(sum(max(0, 1 - mission["candidate_ms"] / mission["baseline_ms"]) for mission in missions) / 5 * 100, 1)
print("REPORT_JSON:" + json.dumps({"tests": {"visible_passed": 6 if visible_failed == 0 else 0, "visible_failed": visible_failed, "hidden_passed": 3 if hidden_failed == 0 else 0, "hidden_failed": hidden_failed}, "missions": missions, "bench": {"improvement_pct": improvement, "missions_passed": passed, "missions_total": 5, "cache_size": int(size), "upstream_calls": int(calls)}, "verdict": "pass" if correct and passed >= 3 else "partial"}))
PY
