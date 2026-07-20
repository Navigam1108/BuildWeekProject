#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/workspace}"; GRADER_DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$ROOT"; HIDDEN_DIR="${GRADER_DIR}/hidden"; [ -d "$HIDDEN_DIR" ] || HIDDEN_DIR=/grader/hidden
if node tests/router.test.mjs >/tmp/visible.out 2>&1; then visible_passed=1; visible_failed=0; else visible_passed=0; visible_failed=1; fi
candidate_ms="$(node benchmarks/bench.mjs | sed -n 's/.*candidate_ms=\([0-9.]*\).*/\1/p')"
if ROUTER_MODULE="$ROOT/src/router.mjs" node "$HIDDEN_DIR/router.invariant.mjs" >/tmp/hidden.out 2>&1 && node -e "process.exit(Number('$candidate_ms') < 300 ? 0 : 1)"; then hidden_passed=5; hidden_failed=0; verdict=strong; else hidden_passed=0; hidden_failed=5; verdict=developing; fi
printf 'REPORT_JSON:%s\n' "$(node -e "console.log(JSON.stringify({tests:{visible_passed:$visible_passed,visible_failed:$visible_failed,hidden_passed:$hidden_passed,hidden_failed:$hidden_failed},bench:{candidate_ms:Number('$candidate_ms'),baseline_ms:4000,target_ms:300},missions:{total:5,strong_threshold:2},verdict:'$verdict'}))")"
