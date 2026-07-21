#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/workspace}"
GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
HIDDEN_DIR="${GRADER_DIR}/hidden"
[ -d "$HIDDEN_DIR" ] || HIDDEN_DIR=/grader/hidden

if node tests/router.test.mjs >/tmp/visible.out 2>&1; then visible_passed=1; visible_failed=0; else visible_passed=0; visible_failed=1; fi
bench_output="$(node benchmarks/bench.mjs)"
candidate_ms="$(sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p' <<<"$bench_output")"
if ROUTER_MODULE="$ROOT/src/router.mjs" node "$HIDDEN_DIR/router.invariant.mjs" >/tmp/hidden.out 2>&1; then hidden_passed=1; hidden_failed=0; else hidden_passed=0; hidden_failed=1; fi

printf 'REPORT_JSON:%s\n' "$(BENCH_OUTPUT="$bench_output" BASELINES="$GRADER_DIR/mission-baselines.json" VISIBLE_PASSED="$visible_passed" HIDDEN_PASSED="$hidden_passed" CANDIDATE_MS="$candidate_ms" node --input-type=module - <<'NODE'
import fs from "node:fs"

const values = Object.fromEntries([...process.env.BENCH_OUTPUT.matchAll(/([a-z_]+_ms)=([0-9.]+)/g)].map(([, key, value]) => [key, Number(value)]))
const baselines = JSON.parse(fs.readFileSync(process.env.BASELINES, "utf8"))
const valid = process.env.VISIBLE_PASSED === "1" && process.env.HIDDEN_PASSED === "1"
const missions = Object.entries(baselines).map(([id, metric]) => {
  const candidate_ms = values[metric.metric]
  // The starter is intentionally correct but inefficient.  A mission should
  // earn a pass only after it is genuinely close to the golden path.
  const threshold_ms = metric.baseline_ms * 0.1 + metric.golden_ms * 0.9
  return { id, baseline_ms: metric.baseline_ms, candidate_ms, golden_ms: metric.golden_ms, passed: valid && candidate_ms <= threshold_ms }
})
const candidate_ms = Number(process.env.CANDIDATE_MS)
const passed = missions.filter(mission => mission.passed).length
console.log(JSON.stringify({
  tests: { visible_passed: Number(process.env.VISIBLE_PASSED), visible_failed: 1 - Number(process.env.VISIBLE_PASSED), hidden_passed: Number(process.env.HIDDEN_PASSED), hidden_failed: 1 - Number(process.env.HIDDEN_PASSED) },
  bench: { candidate_ms, baseline_ms: 9000, target_ms: 300, improvement_pct: Math.round(Math.max(0, (9000 - candidate_ms) / 9000 * 1000) / 10) },
  missions,
  verdict: valid && passed >= 2 ? "strong" : "developing",
}))
NODE
)"
